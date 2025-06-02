
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


export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(false); // Reset submitting state after login attempt
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary rounded-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-6 flex flex-col items-center justify-center">
            <Package className="h-12 w-12 text-primary mb-2" />
            <h1 className="font-headline text-3xl text-primary tracking-tight">Threadcount Tracker</h1>
          </div>
          <CardTitle className="font-headline text-2xl">Welcome Back!</CardTitle>
          <CardDescription className="font-body text-muted-foreground pt-1">
            Sign in to manage your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-body"
              />
            </div>
            <Button type="submit" className="w-full font-headline text-base py-3 mt-2" disabled={isSubmitting || authLoading}>
              {isSubmitting || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pb-8">
          <p className="text-sm text-muted-foreground font-body">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="p-0 text-accent hover:text-accent/80 font-semibold">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
