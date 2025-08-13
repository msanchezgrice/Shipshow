"use client";

import { useState } from "react";
import ProjectEditor from "@/components/ProjectEditor";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  sort: number;
}

interface ProjectsListProps {
  initialProjects: Project[];
  canAdd: boolean;
  paid: boolean;
  maxProjects: number;
}

export default function ProjectsList({ initialProjects, canAdd, paid, maxProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleAddProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh the page to get the new project
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  return (
    <section className="mt-10 rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Projects ({projects.length}{paid ? "" : ` / ${maxProjects}`})</h2>
        {canAdd ? (
          <button 
            onClick={handleAddProject}
            className="rounded-md bg-black text-white px-3 py-2"
          >
            Add project
          </button>
        ) : (
          <a href="/billing" className="rounded-md bg-black text-white px-3 py-2">
            Upgrade to add more
          </a>
        )}
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <ProjectEditor
            key={project.id}
            project={project}
            onUpdate={handleProjectUpdate}
            onDelete={handleProjectDelete}
          />
        ))}
      </div>
      
      {projects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No projects yet. Add your first project to get started!</p>
        </div>
      )}
    </section>
  );
}
