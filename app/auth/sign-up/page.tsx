'use client';

import Link from "next/link";
import { signup, signInWithGoogle } from "../../../lib/actions/auth-actions";
import { Button } from "../../../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "../../../components/ui/input";
import { useSearchParams } from "next/navigation";

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;

        if (!email || !firstName || !lastName) {
            toast.error("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        const result = await signup({ email, firstName, lastName });
        
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
                <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                <p className="text-gray-600 mb-8">
                    Get started with RadarRules - no password needed.
                </p>

                <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleSignIn}
                    loading={isGoogleLoading}
                >
                    <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                    Sign up with Google
                </Button>

                <div className="flex items-center gap-4 my-4">
                    <div className="h-px bg-gray-200 flex-1" />
                    <span className="text-gray-500">or</span>
                    <div className="h-px bg-gray-200 flex-1" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="firstName" className="block text-sm mb-1">First name</label>
                            <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="First name"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="lastName" className="block text-sm mb-1">Last name</label>
                            <Input
                                id="lastName"
                                name="lastName"
                                type="text"
                                className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Last name"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm mb-1">Work email</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="name@company.com"
                            defaultValue={email || ''}
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
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="text-red-600 hover:text-red-700 font-medium"
                    >
                        Log in →
                    </Link>
                </p>

                <p className="mt-8 text-center text-xs text-gray-500">
                    By creating an account, you agree to RadarRules's{' '}
                    <a href="/terms" className="underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="underline">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}