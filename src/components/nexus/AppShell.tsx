import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  FolderLock,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { clearAssurance, touchAssurance } from "@/lib/nexus";

const NAV = [
  { to: "/dashboard", label: "Command", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: FolderLock },
  { to: "/directory", label: "Directory", icon: Users },
  { to: "/custody", label: "Chain of custody", icon: Archive },
] as const;

export function AppShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile: { full_name: string; employee_id: string; office: string; clearance_level: number } | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const bump = () => touchAssurance();
    window.addEventListener("click", bump);
    window.addEventListener("keydown", bump);
    return () => {
      window.removeEventListener("click", bump);
      window.removeEventListener("keydown", bump);
    };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearAssurance();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-vault">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span className="font-display text-lg font-semibold tracking-tight">NEXUS</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground",
                  pathname.startsWith(item.to) && "bg-surface-2 text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {profile && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{profile.full_name}</p>
                <p className="mono-id text-[0.65rem] uppercase text-muted-foreground">
                  {profile.employee_id} · L{profile.clearance_level} · {profile.office}
                </p>
              </div>
            )}
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground",
                pathname.startsWith(item.to) && "bg-surface-2 text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
