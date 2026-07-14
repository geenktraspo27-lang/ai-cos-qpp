/**
 * Hand-written to match supabase/migrations/*.sql. Once a real Supabase
 * project exists, regenerate the authoritative version with:
 *   supabase gen types typescript --linked --schema public > src/types/database.ts
 *
 * `Relationships` is left empty on every table: this app queries related
 * data with separate round-trips (see src/state/AuthContext.tsx) rather than
 * PostgREST embeds, so foreign-key embed typing isn't needed.
 */

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;
type Update<T> = Partial<T>;

interface Table<Row, OptionalOnInsert extends keyof Row> {
  Row: Row;
  Insert: Insert<Row, OptionalOnInsert>;
  Update: Update<Row>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      companies: Table<{ id: string; name: string; created_at: string }, 'id' | 'created_at'>;

      profiles: Table<
        { id: string; company_id: string; display_name: string; role: 'founder' | 'member'; created_at: string },
        'role' | 'created_at'
      >;

      employees: Table<
        {
          id: string; name: string; jp: string; animal: string; color: string;
          role: string; role_jp: string; img: string; persona: string;
        },
        never
      >;

      employee_state: Table<
        { company_id: string; employee_id: string; activity: string; perf: number; done: number; rec: string; updated_at: string },
        'activity' | 'perf' | 'done' | 'rec' | 'updated_at'
      >;

      tasks: Table<
        { id: string; company_id: string; employee_id: string; text: string; position: number; created_at: string },
        'id' | 'position' | 'created_at'
      >;

      company_vision: Table<
        { company_id: string; text: string; progress_pct: number; updated_at: string },
        'progress_pct' | 'updated_at'
      >;

      goals: Table<
        { id: string; company_id: string; name: string; pct: number; owner_employee_id: string; position: number },
        'id' | 'pct' | 'position'
      >;

      kpis: Table<
        { id: string; company_id: string; label: string; value: string; delta: string; good: boolean; position: number },
        'id' | 'delta' | 'good' | 'position'
      >;

      decisions: Table<
        {
          id: string; company_id: string; title: string; rec: string; risk: '低' | '中' | '高';
          by_employee_id: string; detail: string; status: 'pending' | 'approved' | 'hold';
          created_at: string; decided_at: string | null;
        },
        'id' | 'status' | 'created_at' | 'decided_at'
      >;

      decision_messages: Table<
        {
          id: string; decision_id: string; employee_id: string; text: string;
          stance: 'dissent' | 'revision' | null; position: number; created_at: string;
        },
        'id' | 'stance' | 'position' | 'created_at'
      >;

      decision_contributors: Table<{ decision_id: string; employee_id: string }, never>;

      workflows: Table<
        {
          id: string; company_id: string; name: string; owner_employee_id: string; pct: number;
          stages: string[]; current_stage: number; source_goal_id: string | null;
        },
        'id' | 'pct' | 'stages' | 'current_stage' | 'source_goal_id'
      >;

      ideas: Table<
        {
          id: string; company_id: string; title: string; employee_id: string; tag: string; heat: number;
          content: string | null; source_document_id: string | null; created_at: string;
        },
        'id' | 'heat' | 'content' | 'source_document_id' | 'created_at'
      >;

      finance_summary: Table<{ company_id: string; budget_exec_pct: number; suggestion: string }, 'budget_exec_pct' | 'suggestion'>;

      finance_kpis: Table<{ id: string; company_id: string; label: string; value: string; position: number }, 'id' | 'position'>;

      finance_costs: Table<
        { id: string; company_id: string; dept: string; pct: number; color: string; position: number },
        'id' | 'position'
      >;

      contracts: Table<
        { id: string; company_id: string; name: string; due: string; note: string; position: number },
        'id' | 'position'
      >;

      brand_kpis: Table<
        { id: string; company_id: string; label: string; value: string; delta: string; position: number },
        'id' | 'delta' | 'position'
      >;

      campaigns: Table<
        { id: string; company_id: string; name: string; status: string; pct: number; position: number },
        'id' | 'position'
      >;

      market_insights: Table<
        { id: string; company_id: string; employee_id: string; text: string; position: number },
        'id' | 'position'
      >;

      documentation_summary: Table<{ company_id: string; coverage_pct: number }, 'coverage_pct'>;

      documents: Table<
        {
          id: string; company_id: string; title: string; cat: string; employee_id: string; doc_date: string;
          summary: string; created_at: string; source_workflow_id: string | null; content: string | null;
        },
        'id' | 'created_at' | 'source_workflow_id' | 'content'
      >;

      notifications: Table<
        { id: string; company_id: string; employee_id: string; text: string; room: string; unread: boolean; created_at: string },
        'id' | 'unread' | 'created_at'
      >;

      activity_feed: Table<
        { id: string; company_id: string; employee_id: string; text: string; created_at: string },
        'id' | 'created_at'
      >;

      workflow_stage_results: Table<
        {
          id: string; company_id: string; workflow_id: string; stage_index: number; stage_name: string;
          employee_id: string; summary: string; result: string; status: 'generated' | 'approved' | 'rejected';
          created_at: string; approved_at: string | null;
        },
        'id' | 'status' | 'created_at' | 'approved_at'
      >;

      subscriptions: Table<
        {
          company_id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null;
          plan: string; status: string; current_period_end: string | null; created_at: string; updated_at: string;
        },
        'stripe_customer_id' | 'stripe_subscription_id' | 'plan' | 'status' | 'current_period_end' | 'created_at' | 'updated_at'
      >;
    };
    Views: Record<string, never>;
    Functions: {
      complete_workflow: {
        Args: { p_workflow_id: string };
        Returns: { workflow_id: string; current_stage: number; pct: number; document_id: string };
      };
      approve_and_advance_workflow_stage: {
        Args: { p_workflow_id: string; p_expected_stage_index: number };
        Returns: {
          workflow_id: string; current_stage: number; pct: number;
          already_processed: boolean; document_id?: string;
        };
      };
    };
  };
}
