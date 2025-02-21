import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/supabase-middleware";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  console.log(`[Middleware Working]`);
  return await updateSession(request);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)|home",
  ],
};
