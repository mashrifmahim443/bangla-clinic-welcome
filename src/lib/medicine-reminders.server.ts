import { smsProviderParameters, smsProviderStatus } from "./sms-send";
import { smsDeliveryState } from "./sms-history";
import { reminderMessage } from "./medicine-reminders";

export async function sendDueMedicineReminders() {
  const key = process.env["AUTOMAS_SMS_API_KEY"];
  if (!key) return { configured: false, processed: 0 };
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: settings, error: settingError } = await db.from("sms_settings").select("sender_id").eq("id", "automas").maybeSingle();
  if (settingError || !settings?.sender_id) return { configured: false, processed: 0 };
  const { data: due, error } = await db.rpc("claim_due_medicine_reminders");
  if (error) throw new Error("Reminder claim failed");
  const sender = settings.sender_id;
  for (let i = 0; i < (due?.length ?? 0); i += 6) {
    await Promise.all((due ?? []).slice(i, i + 6).map(async row => {
      const message = reminderMessage(row.medicine_name, row.dose, row.timing, row.dose_at);
      const { data: history, error: logError } = await db.from("sms_history").insert({ request_id: row.request_id, recipient: row.recipient, message_text: message, delivery_status: "pending" }).select("id").single();
      if (logError || !history) return;
      const { error: stampError } = await db.from("sms_history").update({ sent_at: new Date().toISOString() }).eq("id", history.id);
      if (stampError) return;
      let httpStatus: number | null = null; let providerStatus: number | null = null;
      try {
        const response = await fetch("https://api.automas.com.bd/smsapiv3", { method: "POST", body: smsProviderParameters(row.recipient, message, sender, key), redirect: "manual", signal: AbortSignal.timeout(4000) });
        httpStatus = response.status; providerStatus = smsProviderStatus(await response.json().catch(() => null));
      } catch { /* Unknown result must never be retried: the provider may have accepted it. */ }
      const delivery = httpStatus !== null && (httpStatus < 200 || httpStatus >= 300) ? "failed" : smsDeliveryState(providerStatus);
      const { error: updateError } = await db.from("sms_history").update({ http_status: httpStatus, provider_status: providerStatus, delivery_status: delivery, delivery_source: "none", delivery_updated_at: new Date().toISOString() }).eq("id", history.id);
      if (updateError) console.error("Reminder history update failed");
    }));
  }
  return { configured: true, processed: due?.length ?? 0 };
}