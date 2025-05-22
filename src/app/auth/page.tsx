"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">HustlePay</CardTitle>
          <CardDescription className="text-md">Secure Mobile Authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Easy and secure access to your chama finances is coming soon via mobile number authentication.
          </p>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input id="phone" type="tel" placeholder="e.g., 0712 345 678" disabled />
          </div>
          <Button className="w-full" disabled>
            <ShieldCheck className="mr-2 h-5 w-5" /> Sign In / Register (Coming Soon)
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-xs text-muted-foreground">
                For development purposes, you can proceed to the app:
            </p>
            <Link href="/" passHref>
                 <Button variant="link" className="text-primary">Go to Dashboard</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
