import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { z } from "zod";

export const Route = createFileRoute("/api/public/jobs/medicine-reminders")({
  server: { handlers: { POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request);
    if (failure) return failure;
    const body = z.object({ kind: z.literal("medicine") }).strict().safeParse(await request.json().catch(() => null));
    if (!body.success) return new Response("Invalid request", { status: 400 });
    const { sendDueMedicineReminders } = await import("@/lib/medicine-reminders.server");
    return Response.json(await sendDueMedicineReminders());
  } } },
});