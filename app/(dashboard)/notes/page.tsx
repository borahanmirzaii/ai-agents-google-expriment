"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-2">
            Capture your thoughts in multiple formats
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
        <select className="px-4 py-2 rounded-md border bg-background">
          <option value="all">All Types</option>
          <option value="text">Text</option>
          <option value="audio">Audio</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        <select className="px-4 py-2 rounded-md border bg-background">
          <option value="all">All Pillars</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
          <option value="career">Career</option>
          <option value="relationships">Relationships</option>
          <option value="mental">Mental</option>
          <option value="learning">Learning</option>
          <option value="recreation">Recreation</option>
          <option value="contribution">Contribution</option>
        </select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder cards */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Notes</CardTitle>
            <CardDescription>Create your first note</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click the &ldquo;New Note&rdquo; button to get started. You can create text,
              audio, image, or video notes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Analysis</CardTitle>
            <CardDescription>Smart organization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your notes are automatically analyzed and tagged using Google
              Gemini AI for easy discovery.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Support</CardTitle>
            <CardDescription>Works everywhere</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and edit notes offline. They&apos;ll sync automatically when
              you&apos;re back online.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
