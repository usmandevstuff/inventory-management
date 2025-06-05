
"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function SignupPage() {
  const { signup, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (!email || !password) {
       toast({
        title: "Validation Error",
        description: "Email and password are required.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    await signup(email, password); 
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-t-4 border-accent rounded-xl">
        <CardHeader className="text-center pt-6 sm:pt-8 pb-3 sm:pb-4">
           <div className="mx-auto mb-4 sm:mb-6 flex flex-col items-center justify-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-2" />
            <h1 className="font-headline text-2xl sm:text-3xl text-primary tracking-tight">Threadcount Tracker</h1>
          </div>
          <CardTitle className="font-headline text-xl sm:text-2xl">Create Account</CardTitle>
          <CardDescription className="font-body text-muted-foreground pt-1 text-xs sm:text-sm">
            Get started with Threadcount Tracker!
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
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-body text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirm-password" className="font-body text-xs sm:text-sm">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="font-body text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            <Button type="submit" className="w-full font-headline text-sm sm:text-base py-2.5 sm:py-3 mt-1 sm:mt-2 bg-accent text-accent-foreground hover:bg-accent/90 h-auto" disabled={isSubmitting || authLoading}>
              {isSubmitting || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pb-6 sm:pb-8">
          <p className="text-xs sm:text-sm text-muted-foreground font-body">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 text-primary hover:text-primary/80 font-semibold text-xs sm:text-sm">
              <Link href="/login">Sign In</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
