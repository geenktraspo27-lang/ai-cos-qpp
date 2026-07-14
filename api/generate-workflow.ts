import type { IncomingMessage, ServerResponse } from 'node:http';
import { AnthropicLLMService } from './_lib/llmService.ts';

/** 課題1's original fixed stage set — the fallback when the LLM path fails. */
const FALLBACK_STAGES = ['計画', '実行', 'レビュー', '完了'];

interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

interface GenerateWorkflowResponseBody {
  workflowName: string;
  stages: string[];
  usedFallback: boolean;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Server-only endpoint: builds Nova's Workflow-design prompt, calls the LLM,
 * and returns either its JSON result or (on any failure) the same fixed
 * Workflow 課題1 always used. ANTHROPIC_API_KEY never reaches the client —
 * saving the Workflow to Supabase remains the existing client-side flow in
 * CompanyDataContext.createWorkflowFromGoal.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  const body = req.body as { goalName?: unknown; missionText?: unknown } | undefined;
  const goalName = typeof body?.goalName === 'string' ? body.goalName.trim() : '';
  const missionText = typeof body?.missionText === 'string' ? body.missionText.trim() : '';

  if (!goalName || !missionText) {
    sendJson(res, 400, { error: 'goalName and missionText are required' });
    return;
  }

  const fallback: GenerateWorkflowResponseBody = {
    workflowName: goalName,
    stages: FALLBACK_STAGES,
    usedFallback: true,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(res, 200, fallback);
    return;
  }

  try {
    const llm = new AnthropicLLMService(apiKey);
    const result = await llm.generateWorkflow({
      employeeName: 'Nova',
      employeeRole: 'CEO',
      missionText,
    });
    sendJson(res, 200, { ...result, usedFallback: false } satisfies GenerateWorkflowResponseBody);
  } catch {
    sendJson(res, 200, fallback);
  }
}
