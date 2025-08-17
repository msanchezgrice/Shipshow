"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AboutMeCardProps {
  initialData: {
    bio?: string | null;
    twitterUrl?: string | null;
    linkedInUrl?: string | null;
  };
}

export default function AboutMeCard({ initialData }: AboutMeCardProps) {
  const [bio, setBio] = useState(initialData.bio || "");
  const [twitterUrl, setTwitterUrl] = useState(initialData.twitterUrl || "");
  const [linkedInUrl, setLinkedInUrl] = useState(initialData.linkedInUrl || "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio,
          twitterUrl,
          linkedInUrl,
        }),
      });

      if (response.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Me</CardTitle>
        <CardDescription>
          Tell visitors about yourself and add your social media links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Write a brief description about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter/X Profile</Label>
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <Input
              id="twitter"
              type="url"
              placeholder="https://twitter.com/yourusername"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn Profile</Label>
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourusername"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="min-w-[100px]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          
          {saveStatus === "saved" && (
            <span className="text-sm text-green-600">✓ Saved successfully</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-600">✗ Failed to save</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
