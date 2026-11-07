import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently erase a user account and all their health data. Admin only. */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.userId)) throw new Error("Bad user id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (data.userId === context.userId) throw new Error("You can't delete your own account.");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const uid = data.userId;

    const { data: appts } = await db.from("appointments").select("id").eq("patient_id", uid);
    const apptIds = (appts ?? []).map((a) => a.id);
    if (apptIds.length) {
      await db.from("consult_messages").delete().in("appointment_id", apptIds);
      await db.from("prescriptions").delete().in("appointment_id", apptIds);
      await db.from("diet_plans").delete().in("appointment_id", apptIds);
    }
    await db.from("consult_messages").delete().eq("sender_id", uid);
    await db.from("prescriptions").delete().eq("patient_id", uid);
    await db.from("diet_plans").delete().eq("patient_id", uid);
    await db.from("doctor_reviews").delete().eq("patient_id", uid);
    await db.from("appointment_notifications").delete().eq("user_id", uid);
    await db.from("appointments").delete().eq("patient_id", uid);
    await db.from("glucose_readings").delete().eq("user_id", uid);
    await db.from("checkin_links").delete().eq("user_id", uid);

    const { data: files } = await db.from("old_prescriptions").select("file_path").eq("user_id", uid);
    const paths = (files ?? []).map((f) => f.file_path);
    if (paths.length) await db.storage.from("old-prescriptions").remove(paths);
    await db.from("old_prescriptions").delete().eq("user_id", uid);

    await db.from("doctor_applications").delete().eq("user_id", uid);
    await db.from("doctor_contacts").delete().eq("user_id", uid);
    await db.from("doctors").update({ user_id: null }).eq("user_id", uid);
    await db.from("deletion_requests").update({ status: "done" }).eq("user_id", uid);

    const { error } = await db.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
