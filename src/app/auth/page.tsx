
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, ShieldCheck, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phoneNumber' | 'otp'>('phoneNumber');
  const { toast } = useToast();

  const handlePhoneNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim().length < 10) {
        toast({
            title: "Invalid Phone Number",
            description: "Please enter a valid phone number.",
            variant: "destructive",
        });
        return;
    }
    // Simulate sending OTP
    toast({
      title: "OTP Sent (Simulated)",
      description: `An OTP has been "sent" to ${phoneNumber}. This feature is under development.`,
    });
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
        toast({
            title: "Invalid OTP",
            description: "Please enter a valid OTP.",
            variant: "destructive",
        });
        return;
    }
    // Simulate OTP verification
    toast({
      title: "Sign In Successful (Simulated)",
      description: "You have been signed in. Authentication logic is under development.",
      variant: "default"
    });
    // Here you would typically redirect the user, e.g., router.push('/');
    // For now, let's redirect to dashboard via link
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
            {step === 'phoneNumber' ? <Smartphone className="h-10 w-10 text-primary" /> : <MessageSquare className="h-10 w-10 text-primary" />}
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {step === 'phoneNumber' ? 'Enter Your Mobile Number' : 'Enter OTP'}
          </CardTitle>
          <CardDescription className="text-md">
            {step === 'phoneNumber' 
              ? "We'll send a one-time password (OTP) to your mobile number."
              : `Enter the OTP sent to ${phoneNumber}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'phoneNumber' ? (
            <form onSubmit={handlePhoneNumberSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="e.g., 0712 345 678" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <Button type="submit" className="w-full">
                <ShieldCheck className="mr-2 h-5 w-5" /> Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="e.g., 123456" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full">
                <ShieldCheck className="mr-2 h-5 w-5" /> Verify OTP & Sign In
              </Button>
               <Button variant="link" className="w-full text-sm" onClick={() => setStep('phoneNumber')}>
                Back to phone number
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-xs text-muted-foreground">
                Authentication is simulated. For development:
            </p>
            <Link href="/">
                 <Button variant="link" className="text-primary">Go to Dashboard</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
