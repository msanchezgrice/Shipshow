import { auth, currentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureUser, MAX_FREE_PROJECTS, isPaid } from "@/lib/subscription";
import Link from "next/link";

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
          <p className="text-sm text-gray-600 mt-1">This is your public URL: projectproof.io/<span className="font-mono">{dbUser.handle}</span></p>
          <form className="mt-4" action="/api/user/handle" method="POST">
            <div className="flex gap-3">
              <input required minLength={3} maxLength={30} pattern="[a-z0-9-]+"
                defaultValue={dbUser.handle} name="handle" className="flex-1 rounded-md border px-3 py-2" />
              <button className="rounded-md bg-black text-white px-4">Save</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Lowercase letters, numbers, and dashes only.</p>
          </form>
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

      <section className="mt-10 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Projects ({dbUser.projects.length}{paid ? "" : ` / ${MAX_FREE_PROJECTS}`})</h2>
          {canAdd ? (
            <form action="/api/projects" method="POST">
              <button className="rounded-md bg-black text-white px-3 py-2">Add project</button>
            </form>
          ) : (
            <Link href="/billing" className="rounded-md bg-black text-white px-3 py-2">Upgrade to add more</Link>
          )}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {dbUser.projects.map((p: { id: string; title: string; description?: string | null; url?: string | null; imageUrl?: string | null; sort: number }) => (
            <div key={p.id} className="rounded-xl border p-4">
              <form action={`/api/projects/${p.id}`} method="POST" className="space-y-2">
                <input name="_method" defaultValue="PUT" type="hidden" />
                <div className="flex gap-3">
                  <input name="title" defaultValue={p.title} placeholder="Title" className="flex-1 rounded-md border px-3 py-2" />
                  <input name="sort" defaultValue={p.sort} type="number" className="w-24 rounded-md border px-3 py-2" />
                </div>
                <textarea name="description" defaultValue={p.description || ""} placeholder="Description" className="w-full rounded-md border px-3 py-2" rows={3} />
                <input name="url" defaultValue={p.url || ""} placeholder="Link (optional)" className="w-full rounded-md border px-3 py-2" />
                <input name="imageUrl" defaultValue={p.imageUrl || ""} placeholder="Image URL (optional)" className="w-full rounded-md border px-3 py-2" />
                <div className="flex justify-between pt-2">
                  <button className="rounded-md border px-3 py-2 hover:bg-gray-50">Save</button>
                </div>
              </form>
              <form action={`/api/projects/${p.id}`} method="POST" className="mt-2">
                <input name="_method" defaultValue="DELETE" type="hidden" />
                <button className="text-red-600">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
