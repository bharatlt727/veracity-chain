import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { getAssurance } from "@/lib/nexus";
import { AppShell } from "@/components/nexus/AppShell";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const assurance = getAssurance();
    if (!assurance || assurance.level < 3) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { data: profile } = useProfile();
  return (
    <AppShell profile={profile ?? null}>
      <Outlet />
    </AppShell>
  );
}
