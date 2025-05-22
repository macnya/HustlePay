"use client";

import React, { useState } from 'react';
import ChamaCard from '@/components/ChamaCard';
import type { Chama } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChamaForm } from '@/components/ChamaForm';

// Mock data for chamas
const mockChamas: Chama[] = [
  {
    id: '1',
    name: 'Holiday Savings Club',
    description: 'Saving up for a group vacation to Zanzibar next year. Fun times ahead!',
    contributionAmount: 5000,
    contributionFrequency: 'monthly',
    members: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, name: `Member ${i+1}`, phone: '0700000000', joinedDate: new Date().toISOString(), totalContributed: 20000 })),
    createdAt: new Date().toISOString(),
    adminId: 'user1',
    totalCollected: 100000,
    goalAmount: 250000,
    nextMeeting: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Tech Investment Group',
    description: 'Pooling funds to invest in promising tech startups and stocks. High risk, high reward!',
    contributionAmount: 10000,
    contributionFrequency: 'monthly',
    members: Array(8).fill(null).map((_, i) => ({ id: `m${i}`, name: `Member ${i+1}`, phone: '0700000000', joinedDate: new Date().toISOString(), totalContributed: 40000 })),
    createdAt: new Date().toISOString(),
    adminId: 'user2',
    totalCollected: 320000,
    goalAmount: 1000000,
  },
  {
    id: '3',
    name: 'Emergency Fund Chama',
    description: 'A safety net for all members. Contributions go towards helping members in times of need.',
    contributionAmount: 2000,
    contributionFrequency: 'weekly',
    members: Array(12).fill(null).map((_, i) => ({ id: `m${i}`, name: `Member ${i+1}`, phone: '0700000000', joinedDate: new Date().toISOString(), totalContributed: 16000 })),
    createdAt: new Date().toISOString(),
    adminId: 'user3',
    totalCollected: 192000,
    nextMeeting: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ChamasPage() {
  const [chamas, setChamas] = useState<Chama[]>(mockChamas);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateChamaDialogOpen, setCreateChamaDialogOpen] = useState(false);

  const handleChamaCreated = (newChama: Chama) => {
    setChamas(prevChamas => [newChama, ...prevChamas]);
    // setCreateChamaDialogOpen(false); // ChamaForm handles this with setOpen
  };

  const filteredChamas = chamas.filter(chama =>
    chama.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chama.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Chamas</h1>
          <p className="text-muted-foreground">Manage your group savings and investments.</p>
        </div>
        <Dialog open={isCreateChamaDialogOpen} onOpenChange={setCreateChamaDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Chama
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create a New Chama</DialogTitle>
            </DialogHeader>
            <ChamaForm onSuccess={handleChamaCreated} setOpen={setCreateChamaDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search chamas by name or description..."
          className="w-full pl-10 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredChamas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChamas.map((chama) => (
            <ChamaCard key={chama.id} chama={chama} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold text-foreground">No Chamas Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "Try adjusting your search term." : "Get started by creating a new chama."}
          </p>
          {!searchTerm && (
             <Dialog open={isCreateChamaDialogOpen} onOpenChange={setCreateChamaDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="mt-4">
                        <PlusCircle className="mr-2 h-5 w-5" /> Create Chama
                    </Button>
                </DialogTrigger>
                 <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                    <DialogTitle className="text-2xl">Create a New Chama</DialogTitle>
                    </DialogHeader>
                    <ChamaForm onSuccess={handleChamaCreated} setOpen={setCreateChamaDialogOpen} />
                </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}
