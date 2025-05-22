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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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


// Assuming you have some chamas to select from
const mockChamas = [
  { id: '1', name: 'Holiday Savings Club' },
  { id: '2', name: 'Tech Investment Group' },
  { id: '3', name: 'Emergency Fund Chama' },
];

const contributionFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  date: z.date({ required_error: "A date for the contribution is required." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  chamaId: z.string().optional(), // Optional: link contribution to a chama
  memberName: z.string().optional(), // Optional: if contributing on behalf of someone or for record
  status: z.enum(['pending', 'paid', 'overdue']),
});

type ContributionFormValues = z.infer<typeof contributionFormSchema>;

interface ContributionFormProps {
  onSuccess?: (data: Contribution) => void;
}

export default function ContributionForm({ onSuccess }: ContributionFormProps) {
  const { toast } = useToast();
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      status: "paid",
    },
    mode: "onChange",
  });

  async function onSubmit(data: ContributionFormValues) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newContribution: Contribution = {
      id: crypto.randomUUID(),
      userId: 'current_user_id', // Replace with actual user ID
      ...data,
      date: data.date.toISOString(),
    };

    toast({
      title: "Contribution Logged!",
      description: `KES ${data.amount} contribution for "${data.description}" has been successfully logged.`,
      variant: "default",
       // Example of an action on the toast
      // action: (
      //   <ToastAction altText="View Details" onClick={() => console.log('View details for', newContribution.id)}>
      //     View
      //   </ToastAction>
      // ),
    });
    
    onSuccess?.(newContribution);
    form.reset({date: new Date(), description: "", amount: undefined, status: "paid", chamaId: undefined, memberName: ""}); // Reset form after submission
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
                  <Input type="number" placeholder="e.g., 1000" {...field} />
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
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  {mockChamas.map(chama => (
                    <SelectItem key={chama.id} value={chama.id}>{chama.name}</SelectItem>
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
              <FormDescription>If this contribution is for a specific member in the selected chama.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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

        <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Logging..." : "Log Contribution"}
        </Button>
      </form>
    </Form>
  );
}
