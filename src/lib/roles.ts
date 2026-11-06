import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "doctor" | "patient";

export function useMyRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { email: null as string | null, roles: [] as AppRole[] };
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (error) throw error;
      return { email: u.user.email ?? null, roles: (data ?? []).map((r) => r.role as AppRole) };
    },
  });
}

export function homeForRoles(roles: AppRole[]) {
  if (roles.includes("admin")) return "/admin" as const;
  if (roles.includes("doctor")) return "/doctor" as const;
  return "/patient" as const;
}
