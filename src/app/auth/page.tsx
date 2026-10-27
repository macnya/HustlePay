"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, ShieldCheck, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeKenyanPhone,
  formatKenyanPhone,
} from "@/lib/kenya";

type Step = "phoneNumber" | "otp" | "name";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [step, setStep] = useState<Step>("phoneNumber");
  const [busy, setBusy] = useState(false);

  const handlePhoneNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msisdn = normalizeKenyanPhone(phoneNumber);
    if (!msisdn) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid Kenyan number, e.g. 0712 345 678.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+${msisdn}`,
    });
    setBusy(false);

    if (error) {
      toast({
        title: "Could not send OTP",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNormalizedPhone(msisdn);
    setStep("otp");
    toast({
      title: "OTP sent",
      description: `We sent a code to ${formatKenyanPhone(msisdn)}.`,
    });
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Enter the 6-digit code we sent you.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+${normalizedPhone}`,
      token: otp.trim(),
      type: "sms",
    });

    if (error || !data.user) {
      setBusy(false);
      toast({
        title: "Verification failed",
        description: error?.message ?? "The code is incorrect or expired.",
        variant: "destructive",
      });
      return;
    }

    // Profile row is created by a database trigger; ask for a name once.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    setBusy(false);
    if (profile?.full_name) {
      router.push("/");
      return;
    }
    setStep("name");
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    if (name.length < 2) {
      toast({
        title: "Enter your name",
        description: "Your name is shown to other chama members.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", user.id);
    }
    setBusy(false);
    router.push("/");
  };

  const headerForStep = {
    phoneNumber: {
      title: "Enter Your Mobile Number",
      description: "We'll send a one-time password (OTP) to your mobile number.",
      icon: <Smartphone className="h-10 w-10 text-primary" />,
    },
    otp: {
      title: "Enter OTP",
      description: normalizedPhone
        ? `Enter the OTP sent to ${formatKenyanPhone(normalizedPhone)}.`
        : "Enter the OTP we sent you.",
      icon: <MessageSquare className="h-10 w-10 text-primary" />,
    },
    name: {
      title: "What's Your Name?",
      description:
        "Other members of your chamas will see this name next to your contributions.",
      icon: <User className="h-10 w-10 text-primary" />,
    },
  }[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
            {headerForStep.icon}
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {headerForStep.title}
          </CardTitle>
          <CardDescription className="text-md">
            {headerForStep.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phoneNumber" && (
            <form onSubmit={handlePhoneNumberSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-md border border-input bg-muted text-sm font-medium">
                    🇰🇪 +254
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                <ShieldCheck className="mr-2 h-5 w-5" />
                {busy ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                <ShieldCheck className="mr-2 h-5 w-5" />
                {busy ? "Verifying..." : "Verify OTP & Sign In"}
              </Button>
              <div className="flex justify-between text-sm">
                <Button
                  type="button"
                  variant="link"
                  className="text-primary px-0"
                  onClick={() => setStep("phoneNumber")}
                >
                  Change number
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-muted-foreground px-0"
                  disabled={busy}
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOtp({
                      phone: `+${normalizedPhone}`,
                    });
                    if (error) {
                      toast({
                        title: "Could not resend OTP",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      toast({ title: "OTP resent" });
                    }
                  }}
                >
                  Resend code
                </Button>
              </div>
            </form>
          )}

          {step === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Jane Wanjiku"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                <ShieldCheck className="mr-2 h-5 w-5" />
                {busy ? "Saving..." : "Continue to HustlePay"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            By continuing you agree to keep your chama contributions accurate.
            Standard SMS rates may apply.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}