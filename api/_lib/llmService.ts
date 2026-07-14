import Anthropic from '@anthropic-ai/sdk';

/**
 * Provider-agnostic LLM surface for AI-COS. AI employees call this — never
 * an SDK client directly — so swapping providers later doesn't touch caller
 * code. Only generateWorkflow is implemented for 課題5; the rest are
 * reserved for future 課題s (document generation, knowledge summarization,
 * employee chat).
 */
export interface GenerateWorkflowInput {
  employeeName: string;
  employeeRole: string;
  missionText: string;
}

export interface GenerateWorkflowResult {
  workflowName: string;
  stages: string[];
}

export interface LLMService {
  generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowResult>;
  generateDocument(input: unknown): Promise<unknown>;
  summarizeKnowledge(input: unknown): Promise<unknown>;
  chatWithEmployee(input: unknown): Promise<unknown>;
}

const MODEL = 'claude-opus-4-8';
const REQUEST_TIMEOUT_MS = 20_000;
const MIN_STAGES = 4;
const MAX_STAGES = 8;

function buildWorkflowPrompt({ employeeName, employeeRole, missionText }: GenerateWorkflowInput): string {
  return `あなたはAI-COSの${employeeRole}です。

名前は${employeeName}です。

Missionを実現するためのWorkflowを設計してください。

条件

・4〜8ステップ
・順番通り実行できる
・日本語
・JSONのみ

Mission
${missionText}`;
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
      { timeout: REQUEST_TIMEOUT_MS },
    );

    if (response.stop_reason === 'refusal') {
      throw new Error('LLM refused the workflow generation request');
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('LLM response contained no text content');
    }

    return parseWorkflowResult(textBlock.text);
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
