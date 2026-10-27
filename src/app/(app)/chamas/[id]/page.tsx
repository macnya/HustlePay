"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Chama, ChamaMember, Transaction } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TransactionListItem from "@/components/TransactionListItem";
import { Users, Target, DollarSign, CalendarDays, Edit, UserPlus, PlusCircle, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChamaForm } from "@/components/ChamaForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { toChama, toTransaction, type ChamaRow, type TransactionRow } from "@/lib/mappers";
import { formatKES, formatKENDateTime, formatKenyanPhone, normalizeKenyanPhone } from "@/lib/kenya";

export default function ChamaDetailsPage() {
  const params = useParams();
  const chamaId = params.id as string;
  const { toast } = useToast();

  const [chama, setChama] = useState<Chama | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  const [txType, setTxType] = useState<Transaction["type"]>("deposit");
  const [txMethod, setTxMethod] = useState<Transaction["method"]>("mpesa");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txMember, setTxMember] = useState("");
  const [savingTx, setSavingTx] = useState(false);

  const loadChama = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const { data } = await supabase
      .from("chamas")
      .select("*, chama_members(*)")
      .eq("id", chamaId)
      .maybeSingle();
    setChama(data ? toChama(data as ChamaRow) : null);

    const { data: txRows } = await supabase
      .from("transactions")
      .select("*")
      .eq("chama_id", chamaId)
      .order("transaction_date", { ascending: false });
    setTransactions(((txRows ?? []) as TransactionRow[]).map(toTransaction));
    setLoading(false);
  }, [chamaId]);

  useEffect(() => {
    loadChama();
  }, [loadChama]);

  const isAdmin = !!chama && chama.adminId === currentUserId;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizeKenyanPhone(memberPhone);
    if (memberName.trim().length < 2) {
      toast({ title: "Enter the member's name", variant: "destructive" });
      return;
    }
    if (!phone) {
      toast({
        title: "Invalid phone number",
        description: "Use a Kenyan number, e.g. 0712 345 678.",
        variant: "destructive",
      });
      return;
    }

    setSavingMember(true);
    const supabase = createClient();
    const { error } = await supabase.from("chama_members").insert({
      chama_id: chamaId,
      name: memberName.trim(),
      phone,
    });
    setSavingMember(false);

    if (error) {
      toast({ title: "Could not add member", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Member added", description: `${memberName.trim()} joined ${chama?.name}.` });
    setMemberName("");
    setMemberPhone("");
    setMemberOpen(false);
    loadChama();
  };

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.ceil(Number(txAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (txDescription.trim().length < 3) {
      toast({ title: "Add a short description", variant: "destructive" });
      return;
    }

    setSavingTx(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").insert({
      chama_id: chamaId,
      type: txType,
      amount,
      description: txDescription.trim(),
      member: txMember.trim() || null,
      method: txMethod,
      status: "completed",
    });
    setSavingTx(false);

    if (error) {
      toast({ title: "Could not log transaction", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Transaction logged", description: `${formatKES(amount)} recorded.` });
    setTxAmount("");
    setTxDescription("");
    setTxMember("");
    setTransactionOpen(false);
    loadChama();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Info size={64} className="text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Chama Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The chama you are looking for does not exist or you may not have permission to view it.
        </p>
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
        {isAdmin && (
          <Button variant="default" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Chama
          </Button>
        )}
      </div>

      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-primary to-orange-400">
          <div className="absolute inset-0 flex flex-col justify-end p-6 bg-black/40">
            <h1 className="text-4xl font-bold text-white tracking-tight">{chama.name}</h1>
            <p className="text-lg text-white/80 line-clamp-2">{chama.description}</p>
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
              <p className="text-lg font-semibold">
                {formatKES(chama.contributionAmount)} / {chama.contributionFrequency}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-lg font-semibold">{formatKES(chama.totalCollected)}</p>
            </div>
          </div>
        </CardContent>
        {chama.goalAmount && (
          <div className="px-6 pb-6">
            <div className="mb-1 flex justify-between text-sm text-muted-foreground">
              <span>Goal: {formatKES(chama.goalAmount)}</span>
              <span className="font-semibold text-primary">{Math.round(progress)}% Reached</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}
        {chama.nextMeeting && (
          <CardFooter className="bg-muted/30 p-4 border-t">
            <p className="text-sm text-muted-foreground flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              Next Meeting:{" "}
              <span className="font-medium text-foreground ml-1">
                {formatKENDateTime(chama.nextMeeting)} EAT
              </span>
            </p>
          </CardFooter>
        )}
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Members ({chama.members.length})</CardTitle>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setMemberOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {chama.members.map((member: ChamaMember) => (
                <li key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md">
                  <Avatar>
                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatKenyanPhone(member.phone)} • Contributed {formatKES(member.totalContributed)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Button variant="default" size="sm" onClick={() => setTransactionOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log Transaction
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <TransactionListItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No transactions recorded yet for this chama.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit chama */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit {chama.name}</DialogTitle>
          </DialogHeader>
          <ChamaForm
            chama={chama}
            onSuccess={(updated) => {
              setChama(updated);
              setEditOpen(false);
            }}
            setOpen={setEditOpen}
          />
        </DialogContent>
      </Dialog>

      {/* Add member */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add a Member</DialogTitle>
            <DialogDescription>
              Members you add can be matched to their M-PESA contributions by name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Full Name</Label>
              <Input
                id="member-name"
                placeholder="e.g. Jane Wanjiku"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-phone">Mobile Number</Label>
              <Input
                id="member-phone"
                type="tel"
                placeholder="0712 345 678"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={savingMember}>
                {savingMember ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log transaction */}
      <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log a Transaction</DialogTitle>
            <DialogDescription>Record cash, bank or manually received payments.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={txType} onValueChange={(v) => setTxType(v as Transaction["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="fine">Fine</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="payout">Payout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={txMethod} onValueChange={(v) => setTxMethod(v as Transaction["method"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-PESA</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount (KES)</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  min={1}
                  placeholder="e.g. 5000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-member">Member (optional)</Label>
                <Input
                  id="tx-member"
                  placeholder="e.g. Alice"
                  value={txMember}
                  onChange={(e) => setTxMember(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-description">Description</Label>
              <Input
                id="tx-description"
                placeholder="e.g. July contribution (cash)"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={savingTx}>
                {savingTx ? "Saving..." : "Log Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
