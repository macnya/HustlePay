"use client";

import React, { useCallback, useEffect, useState } from "react";
import ChamaCard from "@/components/ChamaCard";
import type { Chama } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChamaForm } from "@/components/ChamaForm";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toChama, type ChamaRow } from "@/lib/mappers";

export default function ChamasPage() {
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateChamaDialogOpen, setCreateChamaDialogOpen] = useState(false);

  const loadChamas = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chamas")
      .select("*, chama_members(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChamas((data as ChamaRow[]).map(toChama));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChamas();
  }, [loadChamas]);

  const handleChamaCreated = (newChama: Chama) => {
    setChamas((prev) => [newChama, ...prev.filter((c) => c.id !== newChama.id)]);
  };

  const filteredChamas = chamas.filter(
    (chama) =>
      chama.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chama.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createDialog = (open: boolean, onOpenChange: (o: boolean) => void) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Chama
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a New Chama</DialogTitle>
        </DialogHeader>
        <ChamaForm onSuccess={handleChamaCreated} setOpen={onOpenChange} />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Chamas</h1>
          <p className="text-muted-foreground">Manage your group savings and investments.</p>
        </div>
        {createDialog(isCreateChamaDialogOpen, setCreateChamaDialogOpen)}
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : filteredChamas.length > 0 ? (
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
          {!searchTerm && createDialog(isCreateChamaDialogOpen, setCreateChamaDialogOpen)}
        </div>
      )}
    </div>
  );
}