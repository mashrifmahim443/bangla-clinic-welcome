import { appointmentSmsMessage, doctorSmsPhone } from "./appointment-sms";
import { smsProviderParameters, smsProviderStatus } from "./sms-send";
import { smsDeliveryState } from "./sms-history";

/** Called only after an authenticated booking succeeds. Never accept a recipient from the browser. */
export async function sendDoctorBookingSms(appointmentId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: appointment, error: appointmentError } = await db.from("appointments")
    .select("doctor_id,slot_start,patient_id").eq("id", appointmentId).single();
  if (appointmentError || !appointment) throw new Error("Booking SMS appointment read failed");
  const { data: doctor, error: doctorError } = await db.from("doctors").select("user_id").eq("id", appointment.doctor_id).single();
  if (doctorError) throw new Error("Booking SMS doctor read failed");
  const contact = doctor?.user_id
    ? await db.from("doctor_contacts").select("phone").eq("user_id", doctor.user_id).maybeSingle()
    : { data: null, error: null };
  if (contact.error) throw new Error("Booking SMS contact read failed");
  const recipient = doctorSmsPhone(contact.data?.phone);
  if (!recipient) return "missing_phone";
  const message = appointmentSmsMessage(appointment.slot_start);
  const { data: history, error: claimError } = await db.from("sms_history").insert({
    request_id: appointmentId, sent_by: appointment.patient_id, recipient,
    message_text: message, delivery_status: "pending",
  }).select("id").single();
  if (claimError?.code === "23505") return "already_submitted";
  if (claimError || !history) throw new Error("Booking SMS history claim failed");
  const key = process.env["AUTOMAS_SMS_API_KEY"];
  const { data: settings, error: settingsError } = await db.from("sms_settings").select("sender_id").eq("id", "automas").maybeSingle();
  if (!key || settingsError || !settings?.sender_id) {
    await db.from("sms_history").update({ delivery_status: "failed", delivery_updated_at: new Date().toISOString() }).eq("id", history.id);
    return "not_configured";
  }
  const { error: stampError } = await db.from("sms_history").update({ sent_at: new Date().toISOString() }).eq("id", history.id);
  if (stampError) throw new Error("Booking SMS timestamp failed");
  let httpStatus: number | null = null;
  let providerStatus: number | null = null;
  try {
    const response = await fetch("https://api.automas.com.bd/smsapiv3", {
      method: "POST", body: smsProviderParameters(recipient, message, settings.sender_id, key),
      redirect: "manual", signal: AbortSignal.timeout(15000),
    });
    httpStatus = response.status;
    providerStatus = smsProviderStatus(await response.json().catch(() => null));
    if (!response.ok) console.error("Booking SMS HTTP failure", httpStatus, "code", providerStatus);
  } catch {
    // Provider may have accepted the SMS: do not resend on unknown results or log secrets.
    console.error("Booking SMS result unavailable");
  }
  const delivery = httpStatus !== null && (httpStatus < 200 || httpStatus >= 300) ? "failed" : smsDeliveryState(providerStatus);
  const { error: updateError } = await db.from("sms_history").update({
    http_status: httpStatus, provider_status: providerStatus, delivery_status: delivery,
    delivery_source: "none", delivery_updated_at: new Date().toISOString(),
  }).eq("id", history.id);
  if (updateError) console.error("Booking SMS history update failed");
  return delivery;
}