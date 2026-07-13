export type EmployeeId =
  | 'nova'
  | 'echo'
  | 'sage'
  | 'aurora'
  | 'orbit'
  | 'milo'
  | 'atlas'
  | 'luna';

export interface Employee {
  id: EmployeeId;
  name: string;
  jp: string;
  animal: string;
  color: string;
  role: string;
  roleJp: string;
  img: string;
  persona: string;
  activity: string;
  tasks: string[];
  perf: number;
  done: number;
  rec: string;
}

export type RoomId =
  | 'lobby'
  | 'mission'
  | 'decision'
  | 'finance'
  | 'brain'
  | 'marketing'
  | 'workflow'
  | 'docs'
  | 'employee';

export interface RoomSummary {
  id: RoomId;
  name: string;
  jp: string;
}

export interface Floor {
  id: string;
  label: string;
  rooms: RoomSummary[];
}

export interface StrategicGoal {
  name: string;
  pct: number;
  owner: EmployeeId;
}

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  good: boolean;
}

export interface FeedItem {
  by: EmployeeId;
  text: string;
  t: string;
}

export interface NotificationItem {
  by: EmployeeId;
  text: string;
  t: string;
  room: RoomId;
  unread: boolean;
}

export interface Workflow {
  name: string;
  owner: EmployeeId;
  pct: number;
  stages: string[];
  current: number;
}

export interface DiscussionMessage {
  by: EmployeeId;
  text: string;
  /** Marks a dissenting/revising message, rendered distinctly from agreement. */
  stance?: 'dissent' | 'revision';
}

export interface Decision {
  id: number;
  title: string;
  rec: string;
  risk: '低' | '中' | '高';
  by: EmployeeId;
  detail: string;
  /** README §8: discussion log showing how employees debated to a conclusion. */
  discussion: DiscussionMessage[];
  /** Employees credited at the end of the thread as co-authors of the recommendation. */
  contributors: EmployeeId[];
}

export interface Idea {
  title: string;
  by: EmployeeId;
  tag: string;
  heat: number;
}

export interface FinCost {
  dept: string;
  pct: number;
  color: string;
}

export interface Contract {
  name: string;
  due: string;
  note: string;
}

export interface Campaign {
  name: string;
  status: string;
  pct: number;
}

export interface DocItem {
  title: string;
  cat: string;
  by: EmployeeId;
  date: string;
  summary: string;
}

export interface Vitals {
  k: string;
  v: string;
}
