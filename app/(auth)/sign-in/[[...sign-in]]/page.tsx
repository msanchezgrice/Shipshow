import ClientOnly from "@/components/ClientOnly";
import { SignIn } from "@/lib/auth/client";

export default function Page() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <ClientOnly>
        <SignIn afterSignInUrl="/dashboard" />
      </ClientOnly>
    </main>
  );
}
