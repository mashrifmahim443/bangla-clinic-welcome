import { pageHead } from "@/lib/appointments";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { homeForRoles, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead('Account dashboard', 'Open your Diacare patient, doctor or administrator workspace.'),
  component: () => {
    const { data, isLoading } = useMyRoles();
    if (isLoading || !data) return null;
    return <Navigate to={homeForRoles(data.roles)} replace />;
  },
});
