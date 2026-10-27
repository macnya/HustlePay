"use client";

import React, { useCallback, useEffect, useState } from "react";
import ContributionForm from "@/components/ContributionForm";
import ContributionListItem from "@/components/ContributionListItem";
import type { Contribution } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, BarChartHorizontalBig } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toContribution, type ContributionRow } from "@/lib/mappers";
import { formatKES } from "@/lib/kenya";

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [chamas, setChamas] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string>("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setUserPhone(user.phone ?? "");
    }

    const [{ data: contributionRows }, { data: chamaRows }] = await Promise.all([
      supabase
        .from("contributions")
        .select("*, chamas(name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("chamas").select("id, name").order("created_at", { ascending: false }),
    ]);

    setContributions(((contributionRows ?? []) as ContributionRow[]).map(toContribution));
    setChamas((chamaRows ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleContributionSuccess = (newContribution: Contribution) => {
    setContributions((prev) => [
      newContribution,
      ...prev.filter((c) => c.id !== newContribution.id),
    ]);
  };

  const chamaNames = new Map(chamas.map((c) => [c.id, c.name]));

  const totalContributed = contributions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <Tabs defaultValue="log" className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Contributions</h1>
          <p className="text-muted-foreground">Pay with M-PESA or log contributions and track your history.</p>
        </div>
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="log">
            <BarChartHorizontalBig className="mr-2 h-4 w-4" />
            Log Contribution
          </TabsTrigger>
          <TabsTrigger value="history">
            <ListChecks className="mr-2 h-4 w-4" />
            View History
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="log">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Log a New Contribution</CardTitle>
            <CardDescription>
              Pay via M-PESA STK Push (approved on your phone) or record a cash/bank payment manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userId ? (
              <ContributionForm
                userId={userId}
                userPhone={userPhone}
                chamas={chamas}
                onSuccess={handleContributionSuccess}
              />
            ) : (
              <Skeleton className="h-64" />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Contribution History</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground pt-1">
              <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
              Total Paid Contributions:{" "}
              <span className="font-semibold text-foreground ml-1">
                {loading ? "…" : formatKES(totalContributed)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : contributions.length > 0 ? (
              <ScrollArea className="h-[500px] pr-3">
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <ContributionListItem
                      key={contribution.id}
                      contribution={contribution}
                      chamaName={
                        contribution.chamaId ? chamaNames.get(contribution.chamaId) : undefined
                      }
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