import { prisma } from "@/lib/prisma";
import ProjectCard from "@/components/ProjectCard";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: { handle: string } }) {
  const user = await prisma.user.findUnique({
    where: { handle: params.handle },
    include: { projects: { orderBy: { sort: "asc" } } },
  });
  if (!user) return notFound();

  return (
    <main>
      {/* Back to home header */}
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to shipshow.io
          </Link>
        </div>
      </header>

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
          
          {/* Social links */}
          {(user.twitterUrl || user.linkedInUrl) && (
            <div className="mt-4 flex gap-4">
              {user.twitterUrl && (
                <a 
                  href={user.twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {user.linkedInUrl && (
                <a 
                  href={user.linkedInUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6 grid md:grid-cols-2 gap-6">
          {user.projects.length === 0 ? (
            <p className="text-gray-600">No projects yet.</p>
          ) : (
            user.projects.map((p: { id: string; title: string; description?: string | null; url?: string | null; imageUrl?: string | null }) => (
              <ProjectCard key={p.id} title={p.title} description={p.description} url={p.url} imageUrl={p.imageUrl} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
