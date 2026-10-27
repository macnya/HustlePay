"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Chama } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { toChama, type ChamaMemberRow, type ChamaRow } from "@/lib/mappers";

const chamaFormSchema = z.object({
  name: z.string().min(3, { message: "Chama name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  contributionAmount: z.coerce.number().positive({ message: "Contribution amount must be positive." }),
  contributionFrequency: z.enum(["daily", "weekly", "monthly"]),
  goalAmount: z.coerce.number().optional(),
  nextMeeting: z.string().optional(),
});

type ChamaFormValues = z.infer<typeof chamaFormSchema>;

interface ChamaFormProps {
  chama?: Chama; // Optional: pass existing chama data for editing
  onSuccess?: (data: Chama) => void;
  setOpen?: (open: boolean) => void;
}

export function ChamaForm({ chama, onSuccess, setOpen }: ChamaFormProps) {
  const { toast } = useToast();

  const defaultValues: Partial<ChamaFormValues> = chama
    ? {
        name: chama.name,
        description: chama.description,
        contributionAmount: chama.contributionAmount,
        contributionFrequency: chama.contributionFrequency,
        goalAmount: chama.goalAmount,
        nextMeeting: chama.nextMeeting ? chama.nextMeeting.slice(0, 10) : undefined,
      }
    : {
        contributionFrequency: "monthly",
      };

  const form = useForm<ChamaFormValues>({
    resolver: zodResolver(chamaFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: ChamaFormValues) {
    const supabase = createClient();
    const meetingIso = data.nextMeeting
      ? new Date(`${data.nextMeeting}T10:00:00+03:00`).toISOString()
      : null;

    const payload = {
      name: data.name,
      description: data.description,
      contribution_amount: data.contributionAmount,
      contribution_frequency: data.contributionFrequency,
      goal_amount: data.goalAmount || null,
      next_meeting: meetingIso,
    };

    if (chama) {
      const { data: updated, error } = await supabase
        .from("chamas")
        .update(payload)
        .eq("id", chama.id)
        .select("*, chama_members(*)")
        .single();

      if (error || !updated) {
        toast({
          title: "Could not update chama",
          description: error?.message ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Chama Updated!",
        description: `${data.name} has been updated.`,
      });
      onSuccess?.(toChama(updated as ChamaRow));
      setOpen?.(false);
      return;
    }

    // Create the chama, then enrol the creator as its first member.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in again before creating a chama.",
        variant: "destructive",
      });
      return;
    }

    const { data: created, error } = await supabase
      .from("chamas")
      .insert({ ...payload, admin_id: user.id })
      .select("*, chama_members(*)")
      .single();

    if (error || !created) {
      toast({
        title: "Could not create chama",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    let memberRow: ChamaMemberRow | null = null;
    const { data: insertedMember, error: memberError } = await supabase
      .from("chama_members")
      .insert({
        chama_id: created.id,
        user_id: user.id,
        name: profile?.full_name || "You",
        phone: profile?.phone || user.phone || "",
      })
      .select("*")
      .single();

    if (!memberError) memberRow = insertedMember;

    toast({
      title: "Chama Created!",
      description: `${data.name} is ready. Invite members to start saving together.`,
    });

    onSuccess?.(
      toChama({ ...created, chama_members: memberRow ? [memberRow] : [] } as ChamaRow)
    );
    setOpen?.(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chama Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Holiday Savings Club" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe the purpose of this chama."
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
            name="contributionAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution Amount (KES)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g., 5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contributionFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="goalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Amount (KES, Optional)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g., 100000" {...field} />
                </FormControl>
                <FormDescription>Set a target amount for this chama, if applicable.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nextMeeting"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Meeting (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>Meetings are stored at 10:00 EAT.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          {setOpen && (
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? chama
                ? "Saving..."
                : "Creating..."
              : chama
                ? "Save Changes"
                : "Create Chama"}
          </Button>
        </div>
      </form>
    </Form>
  );
}