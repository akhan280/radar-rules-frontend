"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/supabase-server";
import prisma from "../db";

interface LoginInput {
  email: string;
}

interface SignupInput {
  email: string;
  firstName: string;
  lastName: string;
}

export async function login({ email }: LoginInput) {
  const supabase = await createClient();

  console.log(`login()`, email)

  const user = await prisma.user.findFirst({
    where: {
      email: email
    }
  })

  if (!user) {
    redirect(`/auth/sign-up?email=${email}`)
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/check-email");
}

export async function signup({ email, firstName, lastName }: SignupInput) {
  const supabase = await createClient();

  console.log(`signup()`, email, firstName, lastName)

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/check-email");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  console.log(`signInWithGoogle() called`)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }
}

export async function createOrUpdateUser(userId: string, userEmail: string, firstName?: string, lastName?: string) {
  console.log(`createOrUpdateUser()`, userId, userEmail, firstName, lastName)
  return prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: userEmail,
      firstName,
      lastName,
      projects: {
        create: []
      },
      csvUploads: {
        create: []
      },
    },
    update: {
      email: userEmail,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    },
  });
}
