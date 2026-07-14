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

export interface LLMService {
  generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult>;
  executeWorkflowStage(input: ExecuteWorkflowStageInput): Promise<ExecuteWorkflowStageResult>;
  generateDocument(input: unknown): Promise<unknown>;
  summarizeKnowledge(input: unknown): Promise<unknown>;
  chatWithEmployee(input: unknown): Promise<unknown>;
}

const MODEL = 'claude-opus-4-8';
const WORKFLOW_TIMEOUT_MS = 20_000;
const STAGE_TIMEOUT_MS = 30_000;
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

  chatWithEmployee(): Promise<unknown> {
    return Promise.reject(new Error('chatWithEmployee is not implemented yet'));
  }
}
