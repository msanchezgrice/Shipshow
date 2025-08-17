import { auth, currentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureUser, MAX_FREE_PROJECTS, isPaid } from "@/lib/subscription";
import Link from "next/link";
import HandleForm from "@/components/HandleForm";
import ProjectsList from "@/components/ProjectsList";
import AboutMeCard from "@/components/AboutMeCard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await ensureUser({ id: user.id, firstName: user.firstName, lastName: user.lastName, imageUrl: user.imageUrl });
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { projects: { orderBy: { sort: "asc" } }, subscription: true },
  });

  if (!dbUser) redirect("/sign-in");

  const paid = await isPaid(user.id);
  const max = paid ? Infinity : MAX_FREE_PROJECTS;
  const canAdd = (dbUser.projects.length < max);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
           <p className="text-gray-600">Signed in as <span className="font-medium">{dbUser.handle}</span>. Add projects below to build your shipshow.io page.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${dbUser.handle}`}>
            <Button variant="outline">View public page</Button>
          </Link>
          <Link href="/billing">
            <Button>{paid ? "Manage billing" : "Upgrade"}</Button>
          </Link>
        </div>
      </div>

      <section className="mt-10 grid md:grid-cols-2 gap-8">
        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">Your handle</h2>
          <p className="text-sm text-gray-600 mt-1">This is your public URL: shipshow.io/<span className="font-mono">{dbUser.handle}</span></p>
          <div className="mt-4">
            <HandleForm currentHandle={dbUser.handle} />
          </div>
        </div>

        <AboutMeCard 
          initialData={{
            bio: dbUser.bio,
            twitterUrl: dbUser.twitterUrl,
            linkedInUrl: dbUser.linkedInUrl,
          }}
        />
      </section>

      <ProjectsList 
        initialProjects={dbUser.projects}
        canAdd={canAdd}
        paid={paid}
        maxProjects={MAX_FREE_PROJECTS}
      />
    </main>
  );
}
