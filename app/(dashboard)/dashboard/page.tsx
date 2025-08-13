import { auth, currentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureUser, MAX_FREE_PROJECTS, isPaid } from "@/lib/subscription";
import Link from "next/link";
import HandleForm from "@/components/HandleForm";
import ProjectsList from "@/components/ProjectsList";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await ensureUser({ id: user.id, firstName: user.firstName, lastName: user.lastName, imageUrl: user.imageUrl });
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { projects: { orderBy: { sort: "asc" } }, subscription: true, domains: true },
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
          <Link href={`/${dbUser.handle}`} className="rounded-md border px-3 py-2 hover:bg-gray-50">View public page</Link>
          <Link href="/billing" className="rounded-md bg-black text-white px-3 py-2 hover:opacity-90">{paid ? "Manage billing" : "Upgrade"}</Link>
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

        <div className="rounded-xl border p-6">
          <h2 className="font-semibold">Custom domain {paid ? "" : <span className="text-xs text-indigo-600">(paid)</span>}</h2>
          {dbUser.domains.length === 0 ? (
            <p className="text-sm text-gray-600 mt-1">Point your domain to your page. Requires the Unlimited plan.</p>
          ) : null}
          <form className="mt-4" action="/api/domains/add" method="POST">
            <div className="flex gap-3">
              <input disabled={!paid} name="domain" placeholder="yourdomain.com"
                className="flex-1 rounded-md border px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400" />
              <button disabled={!paid} className="rounded-md bg-black text-white px-4 disabled:opacity-50">Connect</button>
            </div>
          </form>
          {dbUser.domains.length > 0 && (
            <ul className="mt-4 text-sm">
              {dbUser.domains.map((d: { id: string; domain: string }) => (
                <li key={d.id} className="flex items-center justify-between py-1">
                  <span>{d.domain}</span>
                  <a className="text-indigo-600 hover:underline" target="_blank" href={`http://${d.domain}`}>Open</a>
                </li>
              ))}
            </ul>
          )}
          <div className="text-xs text-gray-500 mt-3">
            After connecting, set a CNAME for your domain to <code>cname.vercel-dns.com</code>.
          </div>
        </div>
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
