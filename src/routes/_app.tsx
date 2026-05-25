import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/") throw redirect({ to: "/dashboard" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
