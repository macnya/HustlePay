import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Users, BellRing, BarChart3, Briefcase, Smartphone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKES, formatKENDateTime, formatRelativeKEN } from "@/lib/kenya";
import { toContribution, toTransaction, type ChamaRow, type ContributionRow, type TransactionRow } from "@/lib/mappers";

export const dynamic = "force-dynamic";

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: chamaRows }, { data: contributionRows }, { data: profile }] = await Promise.all([
    supabase
      .from("chamas")
      .select("id, name, next_meeting")
      .order("created_at", { ascending: false }),
    supabase
      .from("contributions")
      .select("*, chamas(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const chamas = (chamaRows ?? []) as Pick<ChamaRow, "id" | "name" | "next_meeting">[];
  const contributions = (contributionRows ?? []).map(toContribution);
  const chamaNames = new Map(chamas.map((c) => [c.id, c.name]));

  const chamaIds = chamas.map((c) => c.id);
  const { data: transactionRows } = chamaIds.length
    ? await supabase
        .from("transactions")
        .select("*")
        .in("chama_id", chamaIds)
        .order("transaction_date", { ascending: false })
        .limit(5)
    : { data: [] as TransactionRow[] };

  const totalContributions = contributions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  const upcomingMeetings = chamas
    .filter((c) => c.next_meeting && new Date(c.next_meeting).getTime() > Date.now())
    .sort((a, b) => new Date(a.next_meeting!).getTime() - new Date(b.next_meeting!).getTime());

  const stats = [
    {
      title: "Total Contributions",
      value: formatKES(totalContributions),
      icon: DollarSign,
      trend: `${contributions.filter((c) => c.status === "paid").length} payments logged`,
      color: "text-primary",
    },
    {
      title: "Active Chamas",
      value: String(chamas.length),
      icon: Users,
      trend: chamas.length ? "Your savings groups" : "Create your first chama",
      color: "text-accent",
    },
    {
      title: "Upcoming Meetings",
      value: String(upcomingMeetings.length),
      icon: BellRing,
      trend: upcomingMeetings[0]
        ? `Next on ${formatKENDateTime(upcomingMeetings[0].next_meeting!)}`
        : "No meetings scheduled",
      color: "text-yellow-500",
    },
  ];

  const activity: ActivityItem[] = [
    ...contributions.slice(0, 5).map((c) => ({
      id: `c-${c.id}`,
      title: `You contributed ${formatKES(c.amount)}`,
      subtitle: c.chamaId ? `To '${chamaNames.get(c.chamaId) ?? "Chama"}' • ${c.description}` : c.description,
      date: c.date,
    })),
    ...(transactionRows ?? []).map((t) => {
      const tx = toTransaction(t as TransactionRow);
      return {
        id: `t-${tx.id}`,
        title: tx.member ? `${tx.member} — ${tx.description}` : tx.description || `${tx.type} of ${formatKES(tx.amount)}`,
        subtitle: `${tx.type === "deposit" ? "Deposit" : tx.type} in '${chamaNames.get(tx.chamaId) ?? "Chama"}' • ${tx.method}`,
        date: tx.date,
      };
    }),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Karibu, {profile?.full_name ?? "Hustler"}!
        </h1>
        <p className="text-muted-foreground">Your central hub for managing chama finances effectively.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/contributions">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" /> Log New Contribution
              </Button>
            </Link>
            <Link href="/chamas">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" /> Create New Chama
              </Button>
            </Link>
            <Link href="/chamas">
              <Button className="w-full justify-start" variant="outline">
                <ArrowRight className="mr-2 h-4 w-4" /> View All Chamas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              Recent Activity
            </CardTitle>
            <CardDescription>Overview of latest transactions and contributions.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {formatRelativeKEN(item.date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No activity yet. Log a contribution or create a chama to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image src="https://placehold.co/80x80.png" alt="M-PESA" width={40} height={40} className="rounded-md" data-ai-hint="financial collaboration" />
              Pay Contributions with M-PESA
            </CardTitle>
            <CardDescription>
              STK Push is live: pay your chama contributions straight from your M-PESA wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Open the Contributions page, choose M-PESA as the payment method and approve the prompt on
              your phone. The payment is confirmed automatically and recorded in your chama ledger.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/contributions">
              <Button variant="default">
                <Smartphone className="mr-2 h-4 w-4" /> Pay with M-PESA
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}