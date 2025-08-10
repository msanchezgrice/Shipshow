import { prisma } from "@/lib/prisma";
import ProjectCard from "@/components/ProjectCard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: { handle: string } }) {
  const user = await prisma.user.findUnique({
    where: { handle: params.handle },
    include: { projects: { orderBy: { sort: "asc" } } },
  });
  if (!user) return notFound();

  return (
    <main>
      <section className="gradient">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex items-center gap-4">
            {user.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name || user.handle} className="w-16 h-16 rounded-full border" />
            )}
            <div>
              <h1 className="text-2xl font-semibold">{user.name || user.handle}</h1>
              <p className="text-gray-600">@{user.handle}</p>
            </div>
          </div>
          {user.bio && <p className="mt-4 text-gray-700">{user.bio}</p>}
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6 grid md:grid-cols-2 gap-6">
          {user.projects.length === 0 ? (
            <p className="text-gray-600">No projects yet.</p>
          ) : (
            user.projects.map((p) => (
              <ProjectCard key={p.id} title={p.title} description={p.description} url={p.url} imageUrl={p.imageUrl} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
