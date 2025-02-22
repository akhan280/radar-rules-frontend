"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/supabase-client";
import { createOrUpdateUser } from "../../../lib/actions/auth-actions";
import { toast } from "sonner";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function handleRedirect() {
            console.log("Starting authentication callback handling...");
            const supabase = createClient();

            try {
                const type = searchParams.get('type');
                console.log("Auth type:", type);

                if (type === 'email') {
                    // Handle email magic link authentication
                    const token_hash = searchParams.get('token_hash');
                    if (!token_hash) {
                        console.error("No token_hash found in URL");
                        throw new Error("No token_hash found in URL");
                    }
                    console.log("Found token_hash in URL");

                    console.log("Verifying OTP...");
                    const { error } = await supabase.auth.verifyOtp({
                        type: 'email',
                        token_hash
                    });

                    if (error) {
                        console.error("Error verifying OTP:", error);
                        throw error;
                    }
                    console.log("Successfully verified OTP");
                } else {
                    // Handle OAuth (Google) authentication
                    const code = searchParams.get('code');
                    if (!code) {
                        console.error("No code found in URL");
                        throw new Error("No code found in URL");
                    }
                    console.log("Found code in URL");

                    console.log("Exchanging code for session...");
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        console.error("Error exchanging code for session:", error);
                        throw error;
                    }
                    console.log("Successfully exchanged code for session");
                }

                console.log("Fetching user data...");
                const { data: { user } } = await supabase.auth.getUser();

                if (!user?.id || !user?.email) {
                    console.error("Missing user data:", { id: user?.id, email: user?.email });
                    throw new Error("User data not found");
                }
                console.log("Successfully retrieved user data", { userId: user.id, email: user.email });

                const metadata = user.user_metadata;
                console.log("User metadata:", metadata);

                console.log("Creating/updating user in database...");
                await createOrUpdateUser(
                    user.id,
                    user.email,
                    metadata?.first_name || metadata?.given_name,
                    metadata?.last_name || metadata?.family_name
                );
                console.log("Successfully created/updated user");

                console.log("Redirecting to dashboard...");
                router.push("/dashboard");
            } catch (error) {
                console.error("Detailed auth error:", error);
                toast.error("Authentication failed. Please try again.");
                router.push("/auth/login?error=Could not authenticate user");
            }
        }

        handleRedirect();
    }, [searchParams, router]);

    return (
        <div className="p-4 md:p-8 flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-white to-gray-50">
            <div className="w-full max-w-md space-y-6 text-center">
                {/* Loading Spinner */}
                <div className="mb-6">
                    <div className="w-8 h-8 border-2 border-gray-100 border-t-gray-400 rounded-full animate-spin mx-auto"></div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Authenticating...
                    </h2>
                    <div className="space-y-2">
                        <p className="text-base text-gray-600">
                            Please wait while we verify your credentials
                        </p>
                        <p className="text-sm text-gray-500">
                            You'll be redirected to your dashboard shortly
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
