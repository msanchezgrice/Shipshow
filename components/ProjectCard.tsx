import Image from "next/image";
import Link from "next/link";

export default function ProjectCard({
  title, description, url, imageUrl,
}: { title: string; description?: string | null; url?: string | null; imageUrl?: string | null; }) {
  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {imageUrl ? (
        <div className="aspect-video relative bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
      )}
      <div className="p-4">
        <div className="font-medium text-lg mb-2">{title}</div>
        {description && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{description}</p>}
        {url && (
          <Link 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span>Live Demo</span>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
