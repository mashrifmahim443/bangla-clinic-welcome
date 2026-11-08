import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { LangProvider } from "@/lib/i18n";
import { ContactVerificationGate } from "@/components/account/contact-verification-gate";
import { supabase } from "@/integrations/supabase/client";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-background px-6 py-24 md:px-16">
      <div className="max-w-xl">
        <p className="font-display text-5xl font-semibold text-primary">৪০৪</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">এই পাতাটা খুঁজে পাওয়া গেল না।</h1>
        <p className="mt-1 text-muted-foreground">We couldn't find this page.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
          প্রথম পাতায় যান / Go to home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen bg-background px-6 py-24 md:px-16">
      <div className="max-w-xl">
        <h1 className="font-display text-2xl font-semibold">পাতাটা খুলতে সমস্যা হয়েছে।</h1>
        <p className="mt-1 text-muted-foreground">This page didn't load. Please try again.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
            আবার চেষ্টা করুন / Try again
          </button>
          <a href="/" className="rounded-md border border-border bg-card px-4 py-2 font-medium transition-colors duration-150 hover:bg-secondary">
            প্রথম পাতায় যান / Go to home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=DM+Sans:wght@400;500;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Hind+Siliguri:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <LangProvider>
        <ContactVerificationGate><Outlet /></ContactVerificationGate>
      </LangProvider>
    </QueryClientProvider>
  );
}
