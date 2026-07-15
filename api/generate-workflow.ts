import type { IncomingMessage, ServerResponse } from 'node:http';
import { AnthropicLLMService } from './_lib/llmService';
import { lookupCompanyEmployee } from './_lib/employeeLookup';

/** 課題1's original fixed stage set — the fallback whenever the LLM path can't run. */
const FALLBACK_STAGES = ['計画', '実行', 'レビュー', '完了'];

interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

type FallbackReason = 'employee_lookup_failed' | 'llm_failed';

interface GenerateWorkflowResponseBody {
  workflowName: string;
  stages: string[];
  usedFallback: boolean;
  fallbackReason?: FallbackReason;
}

interface GenerateWorkflowRequestBody {
  companyVision?: unknown;
  goalTitle?: unknown;
  goalDescription?: unknown;
  employee?: { id?: unknown; name?: unknown; role?: unknown; specialty?: unknown };
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function fallbackBody(workflowName: string, reason: FallbackReason): GenerateWorkflowResponseBody {
  return { workflowName, stages: FALLBACK_STAGES, usedFallback: true, fallbackReason: reason };
}

/**
 * Server-only endpoint: Nova designs a Workflow for the Goal's specific
 * 担当AI社員. The client's `employee` object is never trusted directly —
 * `employee.id` is looked up against Supabase (RLS-scoped to the caller's
 * own company via their access token), and the prompt is built from that
 * canonical record, not from the client-supplied name/role/specialty.
 * ANTHROPIC_API_KEY never reaches the client — saving the Workflow to
 * Supabase remains the existing client-side flow in
 * CompanyDataContext.createWorkflowFromGoal.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  const body = req.body as GenerateWorkflowRequestBody | undefined;
  const companyVision = typeof body?.companyVision === 'string' ? body.companyVision.trim() : '';
  const goalTitle = typeof body?.goalTitle === 'string' ? body.goalTitle.trim() : '';
  const goalDescription = typeof body?.goalDescription === 'string' ? body.goalDescription.trim() : undefined;
  const employeeId = typeof body?.employee?.id === 'string' ? body.employee.id.trim() : '';

  if (!goalTitle || !employeeId) {
    sendJson(res, 400, { error: 'goalTitle and employee.id are required' });
    return;
  }

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  // Never trust the client's own name/role/specialty — re-derive the
  // employee from Supabase, scoped to the caller's company via their JWT.
  const employee = await lookupCompanyEmployee(accessToken, employeeId);
  if (!employee) {
    sendJson(res, 200, fallbackBody(goalTitle, 'employee_lookup_failed'));
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(res, 200, fallbackBody(goalTitle, 'llm_failed'));
    return;
  }

  try {
    const llm = new AnthropicLLMService(apiKey);
    const result = await llm.generateWorkflow({
      companyVision,
      goalTitle,
      goalDescription,
      employee: { name: employee.name, roleJp: employee.roleJp, persona: employee.persona },
    });
    sendJson(res, 200, { ...result, usedFallback: false } satisfies GenerateWorkflowResponseBody);
  } catch {
    sendJson(res, 200, fallbackBody(goalTitle, 'llm_failed'));
  }
}
