import Nav from "@/components/Nav";
import Pricing from "@/components/Pricing";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <Nav />
      <section className="gradient">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              shipshow.io<br/> <span className="text-gray-700">Show your work. Get hired.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              One page per user. Drop in up to 5 projects free. Upgrade for unlimited + custom domain.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link href="/sign-up" className="rounded-md bg-black text-white px-5 py-3 hover:opacity-90">Get started free</Link>
              <Link href="/#pricing" className="rounded-md border px-5 py-3 hover:bg-gray-50">See pricing</Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Built for tinkerers, PMs, ex-tech folks, and vibecode builders.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-3 gap-6">
            {[
              { title: "Claim your handle", desc: "Pick a clean URL: shipshow.io/yourname" },
            { title: "Add up to 5 projects", desc: "Title, description, link & cover image. That’s it." },
            { title: "Share everywhere", desc: "Drop your page into job apps, DMs, and profiles." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border p-6">
              <div className="text-lg font-medium">{f.title}</div>
              <p className="text-gray-600 mt-2 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Pricing />

      <section className="py-24 border-t">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold">Opinionated. Minimal. Fast.</h3>
          <p className="text-gray-600 mt-3">
            We cut everything that slows hiring momentum. You only need proof of work. Put it all on one URL.
          </p>
        </div>
      </section>
    </main>
  );
}
