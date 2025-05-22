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

const chamaFormSchema = z.object({
  name: z.string().min(3, { message: "Chama name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  contributionAmount: z.coerce.number().positive({ message: "Contribution amount must be positive." }),
  contributionFrequency: z.enum(["daily", "weekly", "monthly"]),
  goalAmount: z.coerce.number().optional(),
});

type ChamaFormValues = z.infer<typeof chamaFormSchema>;

interface ChamaFormProps {
  chama?: Chama; // Optional: pass existing chama data for editing
  onSuccess?: (data: Chama) => void; // Callback on successful submission
  setOpen?: (open: boolean) => void; // To close dialog if used in one
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newChamaData: Chama = {
      id: chama?.id || crypto.randomUUID(),
      adminId: chama?.adminId || 'current_user_id', // Replace with actual user ID
      createdAt: chama?.createdAt || new Date().toISOString(),
      members: chama?.members || [],
      totalCollected: chama?.totalCollected || 0,
      ...data,
    };

    toast({
      title: chama ? "Chama Updated!" : "Chama Created!",
      description: `${data.name} has been successfully ${chama ? 'updated' : 'created'}.`,
      variant: "default",
    });

    onSuccess?.(newChamaData);
    if (setOpen) setOpen(false); // Close dialog if applicable
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
                  <Input type="number" placeholder="e.g., 5000" {...field} />
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
        <FormField
          control={form.control}
          name="goalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Amount (KES, Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 100000" {...field} />
              </FormControl>
              <FormDescription>
                Set a target amount for this chama, if applicable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            {setOpen && <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>}
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (chama ? "Updating..." : "Creating...") : (chama ? "Save Changes" : "Create Chama")}
            </Button>
        </div>
      </form>
    </Form>
  );
}
