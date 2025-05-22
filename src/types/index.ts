
export interface Contribution {
  id: string;
  userId: string;
  chamaId?: string;
  amount: number;
  date: string; // ISO date string
  description: string;
  memberName?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Transaction {
  id: string;
  chamaId: string;
  type: 'deposit' | 'withdrawal' | 'fee' | 'payout' | 'fine';
  amount: number;
  date: string; // ISO date string
  description: string;
  member?: string; // Member name or ID associated with transaction
  status: 'completed' | 'pending' | 'failed';
  method: 'mpesa' | 'cash' | 'bank'; // Transaction method
}

export interface ChamaMember {
  id: string;
  name: string;
  phone: string;
  joinedDate: string;
  totalContributed: number;
}

export interface Chama {
  id: string;
  name: string;
  description: string;
  goalAmount?: number;
  contributionAmount: number;
  contributionFrequency: 'daily' | 'weekly' | 'monthly';
  members: ChamaMember[];
  // transactions: Transaction[]; // Transactions will be fetched separately or as sub-collection
  createdAt: string;
  adminId: string;
  totalCollected: number;
  nextMeeting?: string; // ISO date string
}

export type Currency = 'KES' | 'USD' | 'EUR'; // Add more as needed
