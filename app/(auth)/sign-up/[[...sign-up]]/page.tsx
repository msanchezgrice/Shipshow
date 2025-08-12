import { SignUp } from "@/lib/auth/client";

export default function Page() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <SignUp afterSignUpUrl="/dashboard" />
    </main>
  );
}
