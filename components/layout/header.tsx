"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">LifeAI</span>
          </Link>
          {isAuthenticated && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/notes"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Notes
              </Link>
              <Link
                href="/calendar"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Calendar
              </Link>
              <Link
                href="/tasks"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Tasks
              </Link>
              <Link
                href="/pillars"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Pillars
              </Link>
              <Link
                href="/ai-assistant"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                AI Assistant
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {userProfile?.displayName || user?.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
