"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Toggle mock mode: default ON in development, OFF in production unless explicitly overridden
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? (process.env.NODE_ENV === "production" ? "0" : "1")) !== "0";

// Types compatible-enough with Clerk usage in this repo
type AuthContextValue = {
  isSignedIn: boolean;
  signIn: (opts?: { redirectUrl?: string }) => void;
  signOut: (opts?: { redirectUrl?: string }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  if (!USE_MOCKS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clerk = require("@clerk/nextjs");
    const RealProvider = Clerk.ClerkProvider as React.ComponentType<{ children: React.ReactNode }>;
    return <RealProvider>{children}</RealProvider>;
  }

  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setIsSignedIn(getCookie("devSignedIn") === "1");
  }, []);

  const signIn = useCallback((opts?: { redirectUrl?: string }) => {
    setCookie("devSignedIn", "1");
    setIsSignedIn(true);
    if (opts?.redirectUrl) {
      window.location.href = opts.redirectUrl;
    }
  }, []);

  const signOut = useCallback((opts?: { redirectUrl?: string }) => {
    setCookie("devSignedIn", "0");
    setIsSignedIn(false);
    if (opts?.redirectUrl) {
      window.location.href = opts.redirectUrl;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ isSignedIn, signIn, signOut }), [isSignedIn, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): { isSignedIn: boolean } {
  if (!USE_MOCKS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clerk = require("@clerk/nextjs");
    return Clerk.useAuth();
  }
  const ctx = useContext(AuthContext);
  if (!ctx) return { isSignedIn: false };
  return { isSignedIn: ctx.isSignedIn };
}

export function SignInButton(props: { children: React.ReactNode; mode?: string }) {
  if (!USE_MOCKS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SignInButton: RealSignInButton } = require("@clerk/nextjs");
    const Comp = RealSignInButton as React.ComponentType<any>;
    return <Comp {...props} />;
  }
  const ctx = useContext(AuthContext);
  if (!ctx) return <>{props.children}</>;
  return (
    <span
      onClick={() => ctx.signIn({ redirectUrl: "/dashboard" })}
      role="button"
      style={{ display: "inline-flex" }}
    >
      {props.children}
    </span>
  );
}

export function UserButton(props: { afterSignOutUrl?: string }) {
  if (!USE_MOCKS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { UserButton: RealUserButton } = require("@clerk/nextjs");
    const Comp = RealUserButton as React.ComponentType<any>;
    return <Comp {...props} />;
  }
  const ctx = useContext(AuthContext);
  if (!ctx?.isSignedIn) return null;
  return (
    <button
      onClick={() => ctx.signOut({ redirectUrl: props.afterSignOutUrl || "/" })}
      className="text-sm rounded-md border px-3 py-1.5 hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}

export function SignIn({ afterSignInUrl }: { afterSignInUrl?: string }) {
  if (!USE_MOCKS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SignIn: RealSignIn } = require("@clerk/nextjs");
    const Comp = RealSignIn as React.ComponentType<any>;
    return <Comp afterSignInUrl={afterSignInUrl} />;
  }
  const ctx = useContext(AuthContext);
  return (
    <div className="w-full max-w-sm rounded-xl border p-6 text-center">
      <h1 className="text-xl font-semibold">Sign in (dev)</h1>
      <p className="text-sm text-gray-600 mt-1">No auth configured. This signs you in locally.</p>
      <button
        className="mt-6 w-full rounded-md bg-black text-white px-4 py-2 hover:opacity-90"
        onClick={() => ctx?.signIn({ redirectUrl: afterSignInUrl || "/dashboard" })}
      >
        Continue
      </button>
    </div>
  );
}

export function SignUp({ afterSignUpUrl }: { afterSignUpUrl?: string }) {
  if (!USE_MOCKS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SignUp: RealSignUp } = require("@clerk/nextjs");
    const Comp = RealSignUp as React.ComponentType<any>;
    return <Comp afterSignUpUrl={afterSignUpUrl} />;
  }
  const ctx = useContext(AuthContext);
  return (
    <div className="w-full max-w-sm rounded-xl border p-6 text-center">
      <h1 className="text-xl font-semibold">Create account (dev)</h1>
      <p className="text-sm text-gray-600 mt-1">This creates a local session only.</p>
      <button
        className="mt-6 w-full rounded-md bg-black text-white px-4 py-2 hover:opacity-90"
        onClick={() => ctx?.signIn({ redirectUrl: afterSignUpUrl || "/dashboard" })}
      >
        Continue
      </button>
    </div>
  );
}


