"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  sort: number;
}

interface ScrapedData {
  title: string;
  description: string;
  imageUrl: string | null;
  technologies: string[];
  favicon: string | null;
  url: string;
}

interface ProjectEditorProps {
  project: Project;
  onDelete: (id: string) => void;
  onUpdate?: (project: Project) => void;
}

export default function ProjectEditor({ project, onDelete, onUpdate }: ProjectEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    url: project.url || '',
    imageUrl: project.imageUrl || '',
    sort: project.sort
  });
  
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [isScrapingUrl, setIsScrapingUrl] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [scrapeError, setScrapeError] = useState('');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async (data: typeof formData) => {
      setSaveStatus('saving');
      
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          setSaveStatus('saved');
          const updatedProject = { ...project, ...data };
          onUpdate?.(updatedProject);
          
          // Clear saved status after 2 seconds
          setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 2000),
    [project.id, project, onUpdate]
  );

  // Auto-save when form data changes
  useEffect(() => {
    // Only save if data has actually changed from the original
    const hasChanges = (
      formData.title !== project.title ||
      formData.description !== (project.description || '') ||
      formData.url !== (project.url || '') ||
      formData.imageUrl !== (project.imageUrl || '') ||
      formData.sort !== project.sort
    );
    
    if (hasChanges) {
      debouncedSave(formData);
    }
  }, [formData, debouncedSave, project]);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScrapeUrl = async () => {
    if (!isScrapingUrl.trim()) return;
    
    setScrapeStatus('scraping');
    setScrapeError('');
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: isScrapingUrl }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setScrapeStatus('success');
        setScrapedData(data);
        
        // Auto-populate form with scraped data
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          url: isScrapingUrl, // Use the input URL as the project URL
          imageUrl: data.imageUrl || prev.imageUrl,
        }));
        
        setIsScrapingUrl('');
      } else {
        setScrapeStatus('error');
        setScrapeError(data.error || 'Failed to scrape website');
      }
    } catch (error) {
      setScrapeStatus('error');
      setScrapeError('Failed to scrape website');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onDelete(project.id);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const getActiveImageUrl = () => {
    return scrapedData?.imageUrl || formData.imageUrl;
  };

  const getSaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-xs text-gray-500">Saving...</span>;
      case 'saved':
        return <span className="text-xs text-green-600">✓ Saved</span>;
      case 'error':
        return <span className="text-xs text-red-600">✗ Save failed</span>;
      default:
        return null;
    }
  };

  if (isPreview) {
    // Preview mode - show simplified project card
    const activeImageUrl = getActiveImageUrl();
    
    return (
      <div className="rounded-xl border p-4">
        {/* Preview Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600">Preview Mode</span>
          <button
            onClick={() => setIsPreview(false)}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Edit
          </button>
        </div>
        
        {/* Project Card Preview */}
        <div className="rounded-xl border overflow-hidden bg-white">
          {activeImageUrl ? (
            <div className="aspect-video relative bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImageUrl} alt={formData.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
          <div className="p-4">
            <div className="font-medium">{formData.title || 'Untitled Project'}</div>
            {formData.description && (
              <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
            )}
            {formData.url && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                  Live Demo →
                </span>
              </div>
            )}
          </div>
        </div>
        
        {scrapedData?.technologies && scrapedData.technologies.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Technologies detected:</div>
            <div className="flex flex-wrap gap-1">
              {scrapedData.technologies.map((tech) => (
                <span
                  key={tech}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="rounded-xl border p-4">
      {/* Edit Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Edit Mode</span>
          {getSaveStatusIndicator()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(true)}
            className="text-sm text-indigo-600 hover:underline"
          >
            Preview →
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      {/* URL Scraper */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Auto-fill from URL</span>
          {scrapeStatus === 'success' && (
            <span className="text-xs text-green-600">✓ Scraped successfully</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={isScrapingUrl}
            onChange={(e) => setIsScrapingUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            disabled={scrapeStatus === 'scraping'}
          />
          <button
            onClick={handleScrapeUrl}
            disabled={!isScrapingUrl.trim() || scrapeStatus === 'scraping'}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scrapeStatus === 'scraping' ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
        {scrapeError && (
          <p className="text-xs text-red-600 mt-1">{scrapeError}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Project Title"
            className="flex-1 rounded-md border px-3 py-2"
          />
          <input
            type="number"
            value={formData.sort}
            onChange={(e) => handleInputChange('sort', parseInt(e.target.value) || 0)}
            className="w-24 rounded-md border px-3 py-2"
            title="Sort order"
            min="0"
          />
        </div>
        
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Description"
          className="w-full rounded-md border px-3 py-2"
          rows={3}
        />
        
        <input
          type="url"
          value={formData.url}
          onChange={(e) => handleInputChange('url', e.target.value)}
          placeholder="Project URL (optional)"
          className="w-full rounded-md border px-3 py-2"
        />
        
        <div>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            placeholder="Image URL (optional)"
            className="w-full rounded-md border px-3 py-2"
          />
          
          {scrapedData?.imageUrl && formData.imageUrl !== scrapedData.imageUrl && (
            <button
              onClick={() => handleInputChange('imageUrl', scrapedData.imageUrl || '')}
              className="text-xs text-indigo-600 hover:underline mt-1"
            >
              Use scraped image
            </button>
          )}
        </div>

        {/* Image Preview */}
        {getActiveImageUrl() && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Image preview:</div>
            <div className="w-full h-32 border rounded overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getActiveImageUrl()}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
