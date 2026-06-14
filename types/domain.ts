export type IdValue = string | number;

export type ApiRecord = Record<string, unknown>;

export type ApiUser = ApiRecord & {
  id?: IdValue | null;
  pk?: IdValue | null;
  uid?: IdValue | null;
  app_user_id?: IdValue | null;
  appUserId?: IdValue | null;
  user_id?: IdValue | null;
  userId?: IdValue | null;
  username?: string | null;
  email?: string | null;
  emails?: string[] | null;
  account_type?: string | null;
  accountType?: string | null;
  role?: string | null;
  type?: string | null;
};

export type ApiTicket = ApiRecord & {
  id?: IdValue | null;
  pk?: IdValue | null;
  subject?: string | null;
  title?: string | null;
  name?: string | null;
  reporter_name?: string | null;
  email?: string | null;
  reporter_email?: string | null;
  user_email?: string | null;
  ticket_status?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  created_at_display?: string | null;
  pub_date?: string | null;
  escalated?: boolean | null;
  user_id?: IdValue | null;
  userId?: IdValue | null;
  reporter_id?: IdValue | null;
  owner?: IdValue | null;
  created_by?: IdValue | null;
  assigned_to_id?: IdValue | null;
  assigned_to?: ApiUser | null;
  reporter?: ApiUser | null;
  user?: ApiUser | null;
};

export type NormalizedTicket = {
  id: IdValue | null;
  subject: string | null;
  name: string | null;
  displaySubject: string;
  email: string;
  status: string;
  statusDisplay: string;
  ticket_status: string | null;
  created_at: string | null;
  created_at_display: string | null;
  raw: ApiTicket & { escalated: boolean };
  ticketUserId: IdValue | null;
};

export type ChatRole = "agent" | "customer" | "system" | string;

export type ChatMessage = {
  id?: IdValue | string;
  text?: string;
  message?: string;
  at?: string | null;
  role?: ChatRole;
  raw?: unknown;
  status?: "pending" | "failed" | "sent" | string;
  from?: string | IdValue | null;
};

export type ChatPair = {
  message?: string;
  reply?: string;
};
