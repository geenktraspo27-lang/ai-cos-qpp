import type { IncomingMessage, ServerResponse } from 'node:http';
import { AnthropicLLMService } from './_lib/llmService.ts';
import { lookupCompanyEmployee } from './_lib/employeeLookup.ts';
import { createUserScopedSupabaseClient, extractBearerToken } from './_lib/supabaseServer.ts';

interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

interface ChatWithEmployeeResponseBody {
  reply: string;
  createdAt: string;
}

const MAX_GOALS = 10;
const MAX_WORKFLOWS = 10;
const MAX_KNOWLEDGE = 10;
const MAX_HISTORY_MESSAGES = 20; // 直近10往復

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function sendError(res: ServerResponse, status: number) {
  sendJson(res, status, { error: '回答を生成できませんでした。再度お試しください。' });
}

/**
 * Server-only endpoint: lets the founder chat with a specific AI employee,
 * grounded in the company's actual Vision/Goals/Workflows/Brain Knowledge.
 * No fallback on failure — same policy as /api/execute-workflow-stage — a
 * fabricated reply would misrepresent the AI employee, so any failure just
 * returns an error and no assistant message is saved.
 *
 * The client sends only { employeeId, message }. Every other input to the
 * LLM — the employee's real persona, company context, and conversation
 * history — is re-derived server-side through a Supabase client scoped to
 * the caller's own access token, so the client cannot spoof company
 * information or employee identity.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  const body = req.body as { employeeId?: unknown; message?: unknown } | undefined;
  const employeeId = typeof body?.employeeId === 'string' ? body.employeeId.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!employeeId || !message) {
    sendJson(res, 400, { error: 'employeeId and message are required' });
    return;
  }

  const accessToken = extractBearerToken(req.headers.authorization);
  const supabase = createUserScopedSupabaseClient(accessToken);
  if (!supabase) {
    sendError(res, 401);
    return;
  }

  const employee = await lookupCompanyEmployee(accessToken, employeeId);
  if (!employee) {
    sendError(res, 404);
    return;
  }

  try {
    const [visionRes, goalsRes, workflowsRes, ideasRes, historyRes] = await Promise.all([
      supabase.from('company_vision').select('text').maybeSingle(),
      supabase.from('goals').select('name').order('position').limit(MAX_GOALS),
      supabase.from('workflows').select('name, stages, current_stage').limit(50),
      supabase.from('ideas').select('title, content').order('created_at', { ascending: false }).limit(MAX_KNOWLEDGE),
      supabase
        .from('employee_chat_messages')
        .select('role, content')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY_MESSAGES),
    ]);

    const companyVision = (visionRes.data?.text as string | undefined) ?? '';
    const goals = (goalsRes.data ?? []).map((g) => g.name as string);

    const inProgressWorkflows = (workflowsRes.data ?? [])
      .filter((w) => {
        const stages = (w.stages as string[] | null) ?? [];
        const currentStage = w.current_stage as number;
        return stages.length > 0 && currentStage < stages.length - 1;
      })
      .slice(0, MAX_WORKFLOWS)
      .map((w) => {
        const stages = w.stages as string[];
        return `${w.name as string}（現在: ${stages[w.current_stage as number]}）`;
      });

    const knowledge = (ideasRes.data ?? []).map((i) => {
      const content = i.content as string | null;
      return content ? `${i.title as string}: ${content}` : (i.title as string);
    });

    const conversationHistory = (historyRes.data ?? [])
      .slice()
      .reverse()
      .map((r) => ({ role: r.role as 'user' | 'assistant', content: r.content as string }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      sendError(res, 500);
      return;
    }

    // Save the founder's message before calling the LLM, so it survives
    // (and reload still shows it) even if generation fails below.
    const { error: userInsertError } = await supabase
      .from('employee_chat_messages')
      .insert({ employee_id: employeeId, role: 'user', content: message });
    if (userInsertError) {
      sendError(res, 500);
      return;
    }

    const llm = new AnthropicLLMService(apiKey);
    const { reply } = await llm.chatWithEmployee({
      employee: { name: employee.name, roleJp: employee.roleJp, persona: employee.persona },
      companyVision,
      goals,
      workflows: inProgressWorkflows,
      knowledge,
      conversationHistory,
      message,
    });

    const { data: savedAssistant, error: assistantInsertError } = await supabase
      .from('employee_chat_messages')
      .insert({ employee_id: employeeId, role: 'assistant', content: reply })
      .select('created_at')
      .single();
    if (assistantInsertError || !savedAssistant) {
      sendError(res, 500);
      return;
    }

    sendJson(res, 200, {
      reply,
      createdAt: savedAssistant.created_at as string,
    } satisfies ChatWithEmployeeResponseBody);
  } catch {
    sendError(res, 500);
  }
}
