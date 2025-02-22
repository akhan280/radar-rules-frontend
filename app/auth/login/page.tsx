'use client';

import Link from "next/link";
import { login, signInWithGoogle } from "../../../lib/actions/auth-actions";
import { Button } from "../../../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email) {
      toast.error("Please enter your email");
      setIsLoading(false);
      return;
    }

    const result = await login({ email });
    
    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setIsGoogleLoading(true);
      const result = await signInWithGoogle();
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An error occurred during Google sign in');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-gray-600 mb-8">
          Get right back into managing your rules and policies.
        </p>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleSignIn}
          loading={isGoogleLoading}
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </Button>

        <div className="flex items-center gap-4 my-4">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-gray-500">or</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter email address"
            />
            <p className="mt-1 text-sm text-gray-500">
              We'll send you a magic link to sign in securely.
            </p>
          </div>
          <Button
            type="submit"
            loading={isLoading}
            variant="default"
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Send Magic Link
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/auth/sign-up"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Sign up →
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-gray-500">
          By continuing, you agree to RadarRules's{' '}
          <a href="/terms" className="underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}