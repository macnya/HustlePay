import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Users, BellRing, BarChart3, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const stats = [
    { title: "Total Contributions", value: "KES 125,000", icon: DollarSign, trend: "+15% this month", color: "text-primary" },
    { title: "Active Chamas", value: "3", icon: Users, trend: "+1 new chama", color: "text-accent" },
    { title: "Upcoming Payments", value: "2", icon: BellRing, trend: "Next in 3 days", color: "text-yellow-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to HustlePay!</h1>
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
            <Link href="/chamas/create"> 
              {/* Assuming /chamas/create for direct creation or handled by /chamas page */}
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
            {/* Placeholder for recent activity feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Jane Doe contributed KES 5,000</p>
                  <p className="text-xs text-muted-foreground">To 'Holiday Savings' Chama</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">'Tech Group' payout processed</p>
                  <p className="text-xs text-muted-foreground">KES 50,000 distributed</p>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">New member John K. joined 'Investment Club'</p>
                </div>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
            </div>
            <Button variant="link" className="mt-2 text-primary p-0 h-auto">View all activity <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </section>
      
      <section>
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image src="https://placehold.co/80x80.png" alt="Feature Spotlight" width={40} height={40} className="rounded-md" data-ai-hint="financial collaboration" />
                Feature Spotlight: Automated Mpesa Tracking
              </CardTitle>
            <CardDescription>Seamlessly track your Mpesa contributions and payouts directly within HustlePay. Coming soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We are working hard to integrate Mpesa for automatic transaction logging. This will make managing your chama finances even easier.
              Also, look out for automated reminders for contributions and meetings to keep everyone on track!
            </p>
          </CardContent>
           <CardFooter>
            <Button variant="default">Learn More (Coming Soon)</Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
