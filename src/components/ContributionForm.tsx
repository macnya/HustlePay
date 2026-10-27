"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Smartphone } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Contribution } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toContribution, type ContributionRow } from "@/lib/mappers";
import { formatKES, formatKenyanPhone, normalizeKenyanPhone } from "@/lib/kenya";

const contributionFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  date: z.date({ required_error: "A date for the contribution is required." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  chamaId: z.string().optional(),
  memberName: z.string().optional(),
  paymentMethod: z.enum(["mpesa", "manual"]),
  phone: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue"]),
});

type ContributionFormValues = z.infer<typeof contributionFormSchema>;

interface ContributionFormProps {
  userId: string;
  userPhone?: string;
  chamas: { id: string; name: string }[];
  onSuccess?: (data: Contribution) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ContributionForm({
  userId,
  userPhone = "",
  chamas,
  onSuccess,
}: ContributionFormProps) {
  const { toast } = useToast();
  const activeRef = useRef(true);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      status: "paid",
      paymentMethod: "mpesa",
      phone: userPhone ? formatKenyanPhone(userPhone) : "",
    },
    mode: "onChange",
  });

  const paymentMethod = form.watch("paymentMethod");

  async function recordManualPayment(data: ContributionFormValues) {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("contributions")
      .insert({
        user_id: userId,
        chama_id: data.chamaId || null,
        amount: Math.ceil(data.amount),
        contributed_on: data.date.toISOString().slice(0, 10),
        description: data.description,
        member_name: data.memberName?.trim() || null,
        status: data.status,
        payment_method: "manual",
      })
      .select("*, chamas(name)")
      .single();

    if (error || !row) {
      toast({
        title: "Could not save contribution",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Contribution logged!",
      description: `${formatKES(Math.ceil(data.amount))} recorded for "${data.description}".`,
    });
    onSuccess?.(toContribution(row as ContributionRow));
    form.reset({
      date: new Date(),
      description: "",
      amount: undefined,
      status: "paid",
      paymentMethod: "mpesa",
      chamaId: undefined,
      memberName: "",
      phone: userPhone ? formatKenyanPhone(userPhone) : "",
    });
  }

  async function payWithMpesa(data: ContributionFormValues) {
    const phone = normalizeKenyanPhone(data.phone || userPhone);
    if (!phone) {
      toast({
        title: "Invalid M-PESA number",
        description: "Enter your Safaricom number, e.g. 0712 345 678.",
        variant: "destructive",
      });
      return;
    }

    const res = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.ceil(data.amount),
        chamaId: data.chamaId || null,
        description: data.description,
        memberName: data.memberName?.trim() || null,
        date: data.date.toISOString().slice(0, 10),
        phone,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast({
        title: "M-PESA request failed",
        description: payload.error ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Check your phone",
      description: payload.message ?? `Enter your M-PESA PIN to pay ${formatKES(Math.ceil(data.amount))}.`,
    });

    // Poll the contribution until Safaricom's callback confirms it.
    const supabase = createClient();
    let confirmed: ContributionRow | null = null;

    for (let attempt = 0; attempt < 36; attempt++) {
      await sleep(2500);
      if (!activeRef.current) return;

      const { data: row } = await supabase
        .from("contributions")
        .select("*, chamas(name)")
        .eq("id", payload.contributionId)
        .maybeSingle();

      if (row && (row as ContributionRow).status === "paid") {
        confirmed = row as ContributionRow;
        break;
      }
    }

    if (!activeRef.current) return;

    if (confirmed) {
      const confirmedContribution = toContribution(confirmed);
      toast({
        title: "Payment received!",
        description: confirmedContribution.mpesaReceipt
          ? `M-PESA receipt ${confirmedContribution.mpesaReceipt} • ${formatKES(confirmedContribution.amount)}`
          : `${formatKES(confirmedContribution.amount)} confirmed.`,
      });
      onSuccess?.(confirmedContribution);
      form.reset({
        date: new Date(),
        description: "",
        amount: undefined,
        status: "paid",
        paymentMethod: "mpesa",
        chamaId: undefined,
        memberName: "",
        phone: userPhone ? formatKenyanPhone(userPhone) : "",
      });
    } else {
      toast({
        title: "Payment not confirmed yet",
        description:
          "It may still be processing — refresh the history tab in a moment to check.",
      });
      const { data: row } = await supabase
        .from("contributions")
        .select("*, chamas(name)")
        .eq("id", payload.contributionId)
        .maybeSingle();
      if (row) onSuccess?.(toContribution(row as ContributionRow));
    }
  }

  async function onSubmit(data: ContributionFormValues) {
    activeRef.current = true;
    if (data.paymentMethod === "mpesa") {
      await payWithMpesa(data);
    } else {
      await recordManualPayment(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (KES)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g., 1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Contribution</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="chamaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chama (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chama if applicable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {chamas.length === 0 && (
                      <SelectItem value="none" disabled>
                        No chamas yet
                      </SelectItem>
                    )}
                    {chamas.map((chama) => (
                      <SelectItem key={chama.id} value={chama.id}>
                        {chama.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Link this contribution to a specific chama.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memberName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., John Doe (if for specific member)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description/Purpose</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., July Contribution, Late Fee Payment"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mpesa">M-PESA (STK Push)</SelectItem>
                    <SelectItem value="manual">Manual (cash / bank)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {paymentMethod === "mpesa" ? (
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>M-PESA Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0712 345 678" {...field} />
                  </FormControl>
                  <FormDescription>You'll get a prompt on this number.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            "Processing..."
          ) : paymentMethod === "mpesa" ? (
            <>
              <Smartphone className="mr-2 h-4 w-4" /> Pay with M-PESA
            </>
          ) : (
            "Log Contribution"
          )}
        </Button>
      </form>
    </Form>
  );
}