import Image from "next/image";
import Link from "next/link";

export default function ProjectCard({
  title, description, url, imageUrl,
}: { title: string; description?: string | null; url?: string | null; imageUrl?: string | null; }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      {imageUrl ? (
        <div className="aspect-video relative bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
      )}
      <div className="p-4">
        <div className="font-medium">{title}</div>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        {url && <Link href={url} target="_blank" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">Visit</Link>}
      </div>
    </div>
  );
}
