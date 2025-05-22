"use client";

import React, { useState } from 'react';
import ContributionForm from '@/components/ContributionForm';
import ContributionListItem from '@/components/ContributionListItem';
import type { Contribution } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ListChecks, BarChartHorizontalBig } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data for contributions
const mockContributions: Contribution[] = [
  {
    id: 'c1',
    userId: 'user1',
    chamaId: '1',
    amount: 5000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    description: 'July Holiday Club Savings',
    memberName: 'Alice Wonderland',
    status: 'paid',
  },
  {
    id: 'c2',
    userId: 'user1',
    chamaId: '2',
    amount: 10000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    description: 'Tech Investment Q3',
    status: 'paid',
  },
  {
    id: 'c3',
    userId: 'user1',
    amount: 2000,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    description: 'Personal Savings Goal',
    status: 'pending',
  },
    {
    id: 'c4',
    userId: 'user1',
    chamaId: '1',
    amount: 1500,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    description: 'Weekend Getaway Fund',
    memberName: 'Bob The Builder',
    status: 'paid',
  },
  {
    id: 'c5',
    userId: 'user1',
    chamaId: '3',
    amount: 2500,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    description: 'Emergency Fund Top-up',
    status: 'overdue',
  },
];

// Mock chama names for display
const mockChamaNames: { [key: string]: string } = {
  '1': 'Holiday Savings Club',
  '2': 'Tech Investment Group',
  '3': 'Emergency Fund Chama',
};

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>(mockContributions);

  const handleContributionSuccess = (newContribution: Contribution) => {
    setContributions(prevContributions => [newContribution, ...prevContributions]);
  };

  const totalContributed = contributions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <Tabs defaultValue="log" className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Contributions</h1>
            <p className="text-muted-foreground">Log new contributions and track your payment history.</p>
            </div>
            <TabsList className="grid w-full md:w-auto grid-cols-2">
                <TabsTrigger value="log"><DollarSign className="mr-2 h-4 w-4"/>Log Contribution</TabsTrigger>
                <TabsTrigger value="history"><ListChecks className="mr-2 h-4 w-4"/>View History</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="log">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Log a New Contribution</CardTitle>
                <CardDescription>Fill in the details of your payment.</CardDescription>
            </CardHeader>
            <CardContent>
                <ContributionForm onSuccess={handleContributionSuccess} />
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="history">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Contribution History</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground pt-1">
                        <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
                        Total Paid Contributions: <span className="font-semibold text-foreground ml-1">KES {totalContributed.toLocaleString()}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    {contributions.length > 0 ? (
                    <ScrollArea className="h-[500px] pr-3"> {/* Adjust height as needed */}
                        <div className="space-y-4">
                        {contributions.map((contribution) => (
                            <ContributionListItem 
                                key={contribution.id} 
                                contribution={contribution} 
                                chamaName={contribution.chamaId ? mockChamaNames[contribution.chamaId] : undefined}
                            />
                        ))}
                        </div>
                    </ScrollArea>
                    ) : (
                    <div className="text-center py-10">
                        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-xl font-semibold">No Contributions Yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                        Your logged contributions will appear here.
                        </p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
