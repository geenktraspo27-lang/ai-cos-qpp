import type { IncomingMessage, ServerResponse } from 'node:http';
import { AnthropicLLMService } from './_lib/llmService';
import { createUserScopedSupabaseClient, extractBearerToken } from './_lib/supabaseServer';

interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

interface ExecuteWorkflowStageResponseBody {
  summary: string;
  result: string;
  stageIndex: number;
  stageName: string;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function sendError(res: ServerResponse, status: number) {
  sendJson(res, status, { error: '実行結果を生成できませんでした。再度お試しください。' });
}

/**
 * Server-only endpoint: has the Goal's assigned AI employee "execute" the
 * Workflow's current stage and report a result, for the founder to review
 * and approve. Unlike /api/generate-workflow, there is deliberately no
 * automatic fallback here — a fixed/dummy result saved as if it were real
 * AI output would misrepresent the company's actual work, so any failure
 * just returns an error and the Workflow stage never advances.
 *
 * Every piece of business context (the Workflow, its Goal, the company
 * Vision, the assigned employee, prior approved stage results) is re-derived
 * server-side through a Supabase client scoped to the caller's own access
 * token — the client only ever sends `workflowId`, so there is nothing
 * client-supplied to spoof. Saving the generated result goes through the
 * save_workflow_stage_result Postgres function, which re-verifies the
 * workflow belongs to the caller's company and refuses to overwrite an
 * already-approved result.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  const body = req.body as { workflowId?: unknown } | undefined;
  const workflowId = typeof body?.workflowId === 'string' ? body.workflowId.trim() : '';
  if (!workflowId) {
    sendJson(res, 400, { error: 'workflowId is required' });
    return;
  }

  const accessToken = extractBearerToken(req.headers.authorization);
  const supabase = createUserScopedSupabaseClient(accessToken);
  if (!supabase) {
    sendError(res, 401);
    return;
  }

  try {
    const { data: workflow } = await supabase
      .from('workflows')
      .select('name, owner_employee_id, stages, current_stage, source_goal_id')
      .eq('id', workflowId)
      .maybeSingle();
    if (!workflow) {
      sendError(res, 404);
      return;
    }

    const stages = workflow.stages as string[];
    const currentStage = workflow.current_stage as number;
    if (currentStage >= stages.length - 1) {
      sendError(res, 409);
      return;
    }
    const currentStageName = stages[currentStage];

    const { data: employee } = await supabase
      .from('employees')
      .select('name, role_jp, persona')
      .eq('id', workflow.owner_employee_id)
      .maybeSingle();
    if (!employee) {
      sendError(res, 500);
      return;
    }

    let goalTitle = workflow.name as string;
    if (workflow.source_goal_id) {
      const { data: goal } = await supabase
        .from('goals')
        .select('name')
        .eq('id', workflow.source_goal_id)
        .maybeSingle();
      if (goal) goalTitle = goal.name as string;
    }

    const { data: visionRow } = await supabase.from('company_vision').select('text').maybeSingle();
    const companyVision = (visionRow?.text as string | undefined) ?? '';

    const { data: previousRows } = await supabase
      .from('workflow_stage_results')
      .select('result')
      .eq('workflow_id', workflowId)
      .lt('stage_index', currentStage)
      .eq('status', 'approved')
      .order('stage_index', { ascending: true });
    const previousResults = (previousRows ?? []).map((r) => r.result as string);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      sendError(res, 500);
      return;
    }

    const llm = new AnthropicLLMService(apiKey);
    const { summary, result } = await llm.executeWorkflowStage({
      companyVision,
      goalTitle,
      workflowName: workflow.name as string,
      currentStage: currentStageName,
      previousResults,
      employee: { name: employee.name as string, roleJp: employee.role_jp as string, persona: employee.persona as string },
    });

    const { error: saveError } = await supabase.rpc('save_workflow_stage_result', {
      p_workflow_id: workflowId,
      p_summary: summary,
      p_result: result,
    });
    if (saveError) {
      sendError(res, 500);
      return;
    }

    sendJson(res, 200, {
      summary,
      result,
      stageIndex: currentStage,
      stageName: currentStageName,
    } satisfies ExecuteWorkflowStageResponseBody);
  } catch {
    sendError(res, 500);
  }
}
