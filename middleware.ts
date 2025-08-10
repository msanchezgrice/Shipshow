import { NextResponse, NextRequest } from "next/server";

const PUBLIC_HOSTNAMES = [
  "localhost:3000",
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || "",
  process.env.NEXT_PUBLIC_VERCEL_URL || "",
].filter(Boolean);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  const pathname = url.pathname || "/";

  // Ignore Next internals and API routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If host is our root app or *.vercel.app, proceed normally
  const isPublic = PUBLIC_HOSTNAMES.some((h) => host === h || host.endsWith(h));
  const isVercelPreview = host.endsWith(".vercel.app");

  if (!isPublic && !isVercelPreview) {
    try {
      const resolveUrl = new URL("/api/domain/resolve", `https://${host}`);
      resolveUrl.searchParams.set("host", host);
      const res = await fetch(resolveUrl.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.handle) {
          // Rewrite to the user's page
          return NextResponse.rewrite(new URL(`/${data.handle}`, url));
        }
      }
    } catch (e) {
      // fall through
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\..*).*)"],
};
