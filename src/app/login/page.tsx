
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Package, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

export default function LoginPage() {
  const { login, isLoading: authLoading, sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    await login(email, password); 
    setIsSubmitting(false);
  };

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      toast({
        title: "Input Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    await sendPasswordResetEmail(resetEmail);
    setIsPasswordResetDialogOpen(false); 
    setResetEmail(''); 
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-t-4 border-primary rounded-xl">
        <CardHeader className="text-center pt-6 sm:pt-8 pb-3 sm:pb-4">
          <div className="mx-auto mb-4 sm:mb-6 flex flex-col items-center justify-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-2" />
            <h1 className="font-headline text-2xl sm:text-3xl text-primary tracking-tight">Threadcount Tracker</h1>
          </div>
          <CardTitle className="font-headline text-xl sm:text-2xl">Welcome Back!</CardTitle>
          <CardDescription className="font-body text-muted-foreground pt-1 text-xs sm:text-sm">
            Sign in to manage your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-4 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="font-body text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-body text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="font-body text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-body text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            <Button type="submit" className="w-full font-headline text-sm sm:text-base py-2.5 sm:py-3 mt-1 sm:mt-2 h-auto" disabled={isSubmitting || authLoading}>
              {isSubmitting || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pb-6 sm:pb-8">
           <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0 text-xs sm:text-sm text-muted-foreground hover:text-primary font-body">
                Forgot Password?
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md font-body">
              <DialogHeader>
                <DialogTitle className="font-headline text-xl sm:text-2xl">Reset Password</DialogTitle>
                <DialogDescription className="font-body pt-1 text-xs sm:text-sm">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-xs sm:text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="font-body text-xs sm:text-sm w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handlePasswordResetRequest} disabled={authLoading} className="font-body text-xs sm:text-sm w-full sm:w-auto">
                  {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <p className="text-xs sm:text-sm text-muted-foreground font-body">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="p-0 text-accent hover:text-accent/80 font-semibold text-xs sm:text-sm">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
