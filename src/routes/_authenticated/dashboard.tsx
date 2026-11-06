import { createFileRoute, Navigate } from "@tanstack/react-router";
import { homeForRoles, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: () => {
    const { data, isLoading } = useMyRoles();
    if (isLoading || !data) return null;
    return <Navigate to={homeForRoles(data.roles)} replace />;
  },
});
