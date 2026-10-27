import type { Chama, ChamaMember, Contribution, Transaction } from "@/types";

/** Raw rows as returned by PostgREST (snake_case columns). */
export type ChamaMemberRow = {
  id: string;
  chama_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  joined_date: string;
  total_contributed: number | string;
};

export type ChamaRow = {
  id: string;
  name: string;
  description: string;
  goal_amount: number | string | null;
  contribution_amount: number | string;
  contribution_frequency: "daily" | "weekly" | "monthly";
  admin_id: string;
  next_meeting: string | null;
  total_collected: number | string;
  created_at: string;
  chama_members?: ChamaMemberRow[];
};

export type ContributionRow = {
  id: string;
  user_id: string;
  chama_id: string | null;
  amount: number | string;
  contributed_on: string;
  description: string;
  member_name: string | null;
  status: "pending" | "paid" | "overdue";
  payment_method: "mpesa" | "cash" | "bank" | "manual";
  mpesa_receipt: string | null;
  checkout_request_id: string | null;
  created_at: string;
  chamas?: { name: string } | null;
};

export type TransactionRow = {
  id: string;
  chama_id: string;
  type: "deposit" | "withdrawal" | "fee" | "payout" | "fine";
  amount: number | string;
  description: string;
  member: string | null;
  status: "completed" | "pending" | "failed";
  method: "mpesa" | "cash" | "bank";
  transaction_date: string;
  created_at: string;
};

const num = (value: number | string | null | undefined): number =>
  Number(value ?? 0);

export function toMember(row: ChamaMemberRow): ChamaMember {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    joinedDate: row.joined_date,
    totalContributed: num(row.total_contributed),
  };
}

export function toChama(row: ChamaRow): Chama {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    goalAmount: row.goal_amount == null ? undefined : num(row.goal_amount),
    contributionAmount: num(row.contribution_amount),
    contributionFrequency: row.contribution_frequency,
    members: (row.chama_members ?? []).map(toMember),
    createdAt: row.created_at,
    adminId: row.admin_id,
    totalCollected: num(row.total_collected),
    nextMeeting: row.next_meeting ?? undefined,
  };
}

export function toContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    userId: row.user_id,
    chamaId: row.chama_id ?? undefined,
    amount: num(row.amount),
    date: row.created_at,
    description: row.description,
    memberName: row.member_name ?? undefined,
    status: row.status,
    paymentMethod: row.payment_method,
    mpesaReceipt: row.mpesa_receipt ?? undefined,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    chamaId: row.chama_id,
    type: row.type,
    amount: num(row.amount),
    date: row.transaction_date,
    description: row.description,
    member: row.member ?? undefined,
    status: row.status,
    method: row.method,
  };
}