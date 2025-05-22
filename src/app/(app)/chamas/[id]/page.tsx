"use client";

import { useParams } from 'next/navigation';
import type { Chama, ChamaMember, Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TransactionListItem from '@/components/TransactionListItem';
import { Users, Target, DollarSign, CalendarDays, Edit, UserPlus, PlusCircle, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Mock data - replace with actual data fetching
const mockChamas: Chama[] = [
  {
    id: '1',
    name: 'Holiday Savings Club',
    description: 'Saving up for a group vacation to Zanzibar next year. Fun times ahead!',
    contributionAmount: 5000,
    contributionFrequency: 'monthly',
    members: [
        { id: 'm1', name: 'Alice Wonderland', phone: '0712345678', joinedDate: '2023-01-15', totalContributed: 60000 },
        { id: 'm2', name: 'Bob The Builder', phone: '0722345678', joinedDate: '2023-02-01', totalContributed: 55000 },
        { id: 'm3', name: 'Charlie Chaplin', phone: '0732345678', joinedDate: '2023-01-15', totalContributed: 60000 },
    ],
    createdAt: '2023-01-01T10:00:00Z',
    adminId: 'user1',
    totalCollected: 175000,
    goalAmount: 250000,
    nextMeeting: '2024-08-15T14:00:00Z',
  },
   {
    id: '2',
    name: 'Tech Investment Group',
    description: 'Pooling funds to invest in promising tech startups and stocks. High risk, high reward!',
    contributionAmount: 10000,
    contributionFrequency: 'monthly',
    members: [
        { id: 'm4', name: 'Diana Prince', phone: '0711111111', joinedDate: '2022-11-10', totalContributed: 150000 },
        { id: 'm5', name: 'Edward Scissorhands', phone: '0722222222', joinedDate: '2022-12-05', totalContributed: 140000 },
    ],
    createdAt: '2022-11-01T10:00:00Z',
    adminId: 'user2',
    totalCollected: 290000,
    goalAmount: 1000000,
  },
];

const mockTransactions: Transaction[] = [
  { id: 't1', chamaId: '1', type: 'deposit', amount: 5000, date: '2024-07-01T10:00:00Z', description: 'Monthly Contribution', member: 'Alice Wonderland', status: 'completed', method: 'mpesa' },
  { id: 't2', chamaId: '1', type: 'deposit', amount: 5000, date: '2024-07-02T11:30:00Z', description: 'Monthly Contribution', member: 'Bob The Builder', status: 'completed', method: 'mpesa' },
  { id: 't3', chamaId: '1', type: 'fee', amount: 100, date: '2024-06-20T15:00:00Z', description: 'Late Payment Fine', member: 'Charlie Chaplin', status: 'pending', method: 'cash' },
  { id: 't4', chamaId: '2', type: 'deposit', amount: 10000, date: '2024-07-05T09:00:00Z', description: 'Investment Top-up', member: 'Diana Prince', status: 'completed', method: 'bank' },
];


export default function ChamaDetailsPage() {
  const params = useParams();
  const chamaId = params.id as string;
  
  // In a real app, fetch chama details and transactions by ID
  const chama = mockChamas.find(c => c.id === chamaId);
  const transactions = mockTransactions.filter(t => t.chamaId === chamaId);

  if (!chama) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Info size={64} className="text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Chama Not Found</h1>
            <p className="text-muted-foreground mb-6">The chama you are looking for does not exist or you may not have permission to view it.</p>
            <Link href="/chamas">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chamas
                </Button>
            </Link>
        </div>
    );
  }
  
  const progress = chama.goalAmount ? (chama.totalCollected / chama.goalAmount) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/chamas">
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chamas
            </Button>
        </Link>
        <Button variant="default" size="sm">
            <Edit className="mr-2 h-4 w-4" /> Edit Chama
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-primary to-orange-400">
            <Image 
                src="https://placehold.co/1200x300.png" 
                alt={`${chama.name} banner`} 
                layout="fill" 
                objectFit="cover" 
                className="opacity-30"
                data-ai-hint="community finance" 
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6 bg-black/30">
                <h1 className="text-4xl font-bold text-white tracking-tight">{chama.name}</h1>
                <p className="text-lg text-primary-foreground/80 line-clamp-2">{chama.description}</p>
            </div>
        </div>
        
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="text-lg font-semibold">{chama.members.length}</p>
                </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Contribution</p>
                    <p className="text-lg font-semibold">KES {chama.contributionAmount.toLocaleString()} / {chama.contributionFrequency}</p>
                </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Target className="h-8 w-8 text-primary" />
                <div>
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-lg font-semibold">KES {chama.totalCollected.toLocaleString()}</p>
                </div>
            </div>
        </CardContent>
        {chama.goalAmount && (
            <div className="px-6 pb-6">
                <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                    <span>Goal: KES {chama.goalAmount.toLocaleString()}</span>
                    <span className="font-semibold text-primary">{Math.round(progress)}% Reached</span>
                </div>
                <Progress value={progress} className="h-3" />
            </div>
        )}
        {chama.nextMeeting && (
             <CardFooter className="bg-muted/30 p-4 border-t">
                <p className="text-sm text-muted-foreground flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                    Next Meeting: <span className="font-medium text-foreground ml-1">{new Date(chama.nextMeeting).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </p>
            </CardFooter>
        )}
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Members ({chama.members.length})</CardTitle>
            <Button variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {chama.members.map((member: ChamaMember) => (
                <li key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md">
                  <Avatar>
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${member.name.charAt(0)}`} alt={member.name} data-ai-hint="profile avatar" />
                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">Contributed: KES {member.totalContributed.toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Button variant="default" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Log Transaction</Button>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <TransactionListItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No transactions recorded yet for this chama.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
