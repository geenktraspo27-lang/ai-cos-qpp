import Anthropic from '@anthropic-ai/sdk';

/**
 * Provider-agnostic LLM surface for AI-COS. AI employees call this — never
 * an SDK client directly — so swapping providers later doesn't touch caller
 * code. generateWorkflow (課題5/6) and executeWorkflowStage (課題7) are
 * implemented; the rest are reserved for future 課題s (document generation,
 * knowledge summarization, employee chat).
 */
export interface GenerateWorkflowInput {
  companyVision: string;
  goalTitle: string;
  goalDescription?: string;
  /** Always the caller-verified canonical record — never client-trusted fields. */
  employee: {
    name: string;
    roleJp: string;
    persona: string;
  };
}

export interface GenerateWorkflowResult {
  workflowName: string;
  stages: string[];
}

export interface ExecuteWorkflowStageInput {
  companyVision: string;
  goalTitle: string;
  workflowName: string;
  currentStage: string;
  previousResults: string[];
  /** Always the caller-verified canonical record — never client-trusted fields. */
  employee: {
    name: string;
    roleJp: string;
    persona: string;
  };
}

export interface ExecuteWorkflowStageResult {
  summary: string;
  result: string;
}

export interface ChatWithEmployeeInput {
  /** Always the caller-verified canonical record — never client-trusted fields. */
  employee: {
    name: string;
    roleJp: string;
    persona: string;
  };
  companyVision: string;
  /** Strategic Goal titles, already capped server-side (max 10). */
  goals: string[];
  /** In-progress Workflow summaries, already capped server-side (max 10). */
  workflows: string[];
  /** Recent Brain Knowledge entries, already capped server-side (max 10). */
  knowledge: string[];
  /** Already capped server-side (直近10往復 = up to 20 entries), oldest first. */
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  message: string;
}

export interface ChatWithEmployeeResult {
  reply: string;
}

export interface LLMService {
  generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult>;
  executeWorkflowStage(input: ExecuteWorkflowStageInput): Promise<ExecuteWorkflowStageResult>;
  generateDocument(input: unknown): Promise<unknown>;
  summarizeKnowledge(input: unknown): Promise<unknown>;
  chatWithEmployee(input: ChatWithEmployeeInput): Promise<ChatWithEmployeeResult>;
}

const MODEL = 'claude-opus-4-8';
const WORKFLOW_TIMEOUT_MS = 20_000;
const STAGE_TIMEOUT_MS = 30_000;
const CHAT_TIMEOUT_MS = 25_000;
const MIN_STAGES = 4;
const MAX_STAGES = 8;

/**
 * 課題6: Nova stays the designer — she analyzes the Strategic Goal, then
 * designs a Workflow the specific担当AI社員 can execute, reflecting their
 * role/specialty. The LLM is never asked to *become* the employee, only to
 * design work for them, and it never sees or decides any DB identifier
 * (employee/goal/company id, progress, or workflow status).
 */
function buildWorkflowPrompt({ companyVision, goalTitle, goalDescription, employee }: GenerateWorkflowInput): string {
  return `あなたはAI-COSのCEO、Novaです。

会社のStrategic Goalを分析し、担当AI社員が実行できる
具体的なWorkflowを設計してください。

会社のVision
${companyVision}

Strategic Goal
${goalTitle}${goalDescription ? `\n${goalDescription}` : ''}

担当AI社員
名前：${employee.name}
役割：${employee.roleJp}
専門分野：${employee.persona}

担当社員の専門性を反映しつつ、Mission全体を達成できる
4〜8件の連続したステージを作成してください。

条件

・4〜8ステップ
・順番通り実行できる
・日本語
・JSONのみ`;
}

function parseWorkflowResult(raw: string): GenerateWorkflowResult {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('LLM response is not a JSON object');
  }
  const { workflow_name, stages } = parsed as Record<string, unknown>;

  if (typeof workflow_name !== 'string' || workflow_name.trim() === '') {
    throw new Error('LLM response missing workflow_name');
  }
  if (!Array.isArray(stages) || stages.length < MIN_STAGES || stages.length > MAX_STAGES) {
    throw new Error(`LLM response stages must have ${MIN_STAGES}-${MAX_STAGES} entries`);
  }
  const cleanStages = stages.map((s) => {
    if (typeof s !== 'string' || s.trim() === '') {
      throw new Error('LLM response stage is not a non-empty string');
    }
    return s.trim();
  });

  return { workflowName: workflow_name.trim(), stages: cleanStages };
}

/**
 * 課題7: Nova is still the designer/reporting line, not the executor. The
 * prompt asks the *employee* (by their real role/persona) to report having
 * carried out the current stage — never to decide what stage they're on,
 * never to invent prior history the caller didn't supply.
 */
function buildStagePrompt({
  companyVision,
  goalTitle,
  workflowName,
  currentStage,
  previousResults,
  employee,
}: ExecuteWorkflowStageInput): string {
  const previousBlock =
    previousResults.length > 0
      ? previousResults.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : '(まだありません)';

  return `あなたはAI-COSの${employee.roleJp}、${employee.name}です。

以下のWorkflowの現在のステージを実行し、その実行結果を報告してください。

会社のVision
${companyVision}

Strategic Goal
${goalTitle}

Workflow
${workflowName}

現在のステージ
${currentStage}

これまでの実行結果
${previousBlock}

あなたの役割・専門分野
役割：${employee.roleJp}
専門分野：${employee.persona}

条件

・現在のステージの業務を実際に行ったという体で、具体的な成果物や内容を報告してください
・summaryは1〜2文の要約、resultは詳細な実行結果にしてください
・日本語
・JSONのみ`;
}

function parseStageResult(raw: string): ExecuteWorkflowStageResult {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('LLM response is not a JSON object');
  }
  const { summary, result } = parsed as Record<string, unknown>;

  if (typeof summary !== 'string' || summary.trim() === '') {
    throw new Error('LLM response missing summary');
  }
  if (typeof result !== 'string' || result.trim() === '') {
    throw new Error('LLM response missing result');
  }

  return { summary: summary.trim(), result: result.trim() };
}

/**
 * 課題10: the assigned employee answers the founder's question using only
 * the company context the server derived (Vision/Goals/Workflows/Brain
 * Knowledge) — never information the LLM invents. Explicitly told it cannot
 * create/modify Workflows or change any data, since this endpoint is
 * chat-only (no side effects beyond saving the conversation).
 */
function buildChatSystemPrompt({ employee, companyVision, goals, workflows, knowledge }: ChatWithEmployeeInput): string {
  const goalsBlock = goals.length > 0 ? goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : '(なし)';
  const workflowsBlock = workflows.length > 0 ? workflows.map((w, i) => `${i + 1}. ${w}`).join('\n') : '(なし)';
  const knowledgeBlock = knowledge.length > 0 ? knowledge.map((k, i) => `${i + 1}. ${k}`).join('\n') : '(なし)';

  return `あなたはAI-COSの${employee.roleJp}、${employee.name}です。

会社のfounder（ユーザー）からの質問や相談に、あなたの役割・専門性を
活かして答えてください。以下は会社の実際の情報です。

会社のVision
${companyVision || '(未設定)'}

Strategic Goals（最大10件）
${goalsBlock}

進行中のWorkflow（最大10件）
${workflowsBlock}

Brainに保存された知識（直近10件）
${knowledgeBlock}

あなたの役割・専門分野
役割：${employee.roleJp}
専門分野：${employee.persona}

条件

・上記の会社情報を踏まえて、あなたの立場から具体的に回答してください
・情報が不足していて分からないことは、正直に「分かりません」と答えてください
・あなたはWorkflowの作成・変更やデータベースの変更は行えません。会話のみ行ってください
・日本語
・JSONのみ`;
}

function parseChatResult(raw: string): ChatWithEmployeeResult {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('LLM response is not a JSON object');
  }
  const { reply } = parsed as Record<string, unknown>;

  if (typeof reply !== 'string' || reply.trim() === '') {
    throw new Error('LLM response missing reply');
  }

  return { reply: reply.trim() };
}

function extractText(response: Anthropic.Message): string {
  if (response.stop_reason === 'refusal') {
    throw new Error('LLM refused the request');
  }
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('LLM response contained no text content');
  }
  return textBlock.text;
}

export class AnthropicLLMService implements LLMService {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult> {
    const response = await this.client.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                workflow_name: { type: 'string' },
                stages: { type: 'array', items: { type: 'string' } },
              },
              required: ['workflow_name', 'stages'],
              additionalProperties: false,
            },
          },
        },
        messages: [{ role: 'user', content: buildWorkflowPrompt(input) }],
      },
      { timeout: WORKFLOW_TIMEOUT_MS },
    );

    return parseWorkflowResult(extractText(response));
  }

  async executeWorkflowStage(input: ExecuteWorkflowStageInput): Promise<ExecuteWorkflowStageResult> {
    const response = await this.client.messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                result: { type: 'string' },
              },
              required: ['summary', 'result'],
              additionalProperties: false,
            },
          },
        },
        messages: [{ role: 'user', content: buildStagePrompt(input) }],
      },
      { timeout: STAGE_TIMEOUT_MS },
    );

    return parseStageResult(extractText(response));
  }

  generateDocument(): Promise<unknown> {
    return Promise.reject(new Error('generateDocument is not implemented yet'));
  }

  summarizeKnowledge(): Promise<unknown> {
    return Promise.reject(new Error('summarizeKnowledge is not implemented yet'));
  }

  async chatWithEmployee(input: ChatWithEmployeeInput): Promise<ChatWithEmployeeResult> {
    const response = await this.client.messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        system: buildChatSystemPrompt(input),
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                reply: { type: 'string' },
              },
              required: ['reply'],
              additionalProperties: false,
            },
          },
        },
        messages: [
          ...input.conversationHistory.map((m) => ({ role: m.role, content: m.content }) as const),
          { role: 'user' as const, content: input.message },
        ],
      },
      { timeout: CHAT_TIMEOUT_MS },
    );

    return parseChatResult(extractText(response));
  }
}
