import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chamas", "/contributions"];
const isProtected = (path: string) =>
  path === "/" || PROTECTED_PREFIXES.some((p) => path.startsWith(p));

/**
 * Refreshes the Supabase auth session on every request and guards the app
 * routes: signed-out users go to /auth, signed-in users are kept off /auth.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "local-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalidates the JWT against Supabase instead of trusting it.
  // If Supabase is unreachable (e.g. missing env vars), treat as signed out.
  let user: { id: string } | null = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  const path = request.nextUrl.pathname;

  if (!user && isProtected(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && path === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, Next internals and API routes
     * (API routes do their own auth checks; the M-Pesa callback is public).
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|zip|pdf)$).*)",
  ],
};