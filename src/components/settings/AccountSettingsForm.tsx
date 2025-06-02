
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { useState } from "react";

const updateEmailSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address." }),
});
type UpdateEmailFormValues = z.infer<typeof updateEmailSchema>;

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // path of error
});
type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export function AccountSettingsForm() {
  const { user, updateUserEmail, updateUserPassword, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const emailForm = useForm<UpdateEmailFormValues>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      newEmail: user?.email || "",
    },
    mode: "onChange",
  });

  const passwordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  async function onUpdateEmail(data: UpdateEmailFormValues) {
    setIsEmailSubmitting(true);
    const success = await updateUserEmail(data.newEmail);
    if (success) {
      // Toast is handled in AuthContext, but you could add more specific UI updates here
      // emailForm.reset({ newEmail: data.newEmail }); // Reflect pending change
    }
    setIsEmailSubmitting(false);
  }

  async function onUpdatePassword(data: UpdatePasswordFormValues) {
    setIsPasswordSubmitting(true);
    const success = await updateUserPassword(data.newPassword);
    if (success) {
      passwordForm.reset();
    }
    setIsPasswordSubmitting(false);
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl text-primary">Update Email Address</CardTitle>
          </div>
          <CardDescription className="font-body">
            Current email: <span className="font-semibold text-foreground">{user?.email}</span>. 
            Changing your email will require confirmation via both your old and new email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="space-y-6">
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline">New Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.new.email@example.com" {...field} className="font-body"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isEmailSubmitting || authLoading} className="font-body bg-primary text-primary-foreground hover:bg-primary/90">
                  {isEmailSubmitting || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Email
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <KeyRound className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl text-primary">Update Password</CardTitle>
          </div>
           <CardDescription className="font-body">
            Choose a new, strong password for your account. Minimum 6 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="font-body"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="font-body"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPasswordSubmitting || authLoading} className="font-body bg-primary text-primary-foreground hover:bg-primary/90">
                  {isPasswordSubmitting || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
