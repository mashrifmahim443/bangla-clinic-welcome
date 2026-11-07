import { afterEach, expect, it, vi } from "vitest";
import { appointmentSmsMessage, doctorSmsPhone } from "./appointment-sms";

const insert = vi.fn();
const update = vi.fn();
const fetchMock = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: (table: string) => ({
    select: () => ({ eq: () => ({
      single: async () => table === "appointments"
        ? { data: { doctor_id: "doctor", patient_id: "patient", slot_start: "2026-11-08T12:00:00Z", reason: "চার পায়ে ঝিনঝিন করছে, স্যুগার বেশি" } }
        : { data: { user_id: "doctor-user" } },
      maybeSingle: async () => ({ data: table === "doctor_contacts"
        ? { phone: "01772258197" }
        : table === "profiles" ? { full_name: "মাহিম আহম্মেদ" } : { sender_id: "saved-sender" } }),
    }) }),
    insert: (row: unknown) => { insert(row); return { select: () => ({ single: async () => insert.mock.results.length > 1
      ? { error: { code: "23505" } } : { data: { id: "history" } } }) }; },
    update: (row: unknown) => { update(row); return { eq: async () => ({ error: null }) }; },
  }),
} }));

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("uses the doctor profile phone and saved SMS service, never a patient-supplied number", async () => {
  vi.stubEnv("AUTOMAS_SMS_API_KEY", "test-only-key");
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ response: [{ status: 0 }] }) }));
  const { sendDoctorBookingSms } = await import("./appointment-sms.server");
  expect(await sendDoctorBookingSms("appointment-id")).toBe("accepted");
  const call = fetchMock.mock.calls[0];
  if (!call) throw new Error("Expected a provider request");
  const [url, request] = call;
  expect(url).toBe("https://api.automas.com.bd/smsapiv3");
  expect(request.body.get("msisdn")).toBe("01772258197");
  expect(request.body.get("sender")).toBe("saved-sender");
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ request_id: "appointment-id", recipient: "01772258197" }));
});

it("names the patient and their problem in the doctor SMS", async () => {
  vi.stubEnv("AUTOMAS_SMS_API_KEY", "test-only-key");
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ response: [{ status: 0 }] }) }));
  const { sendDoctorBookingSms } = await import("./appointment-sms.server");
  await sendDoctorBookingSms("named-appointment");
  const sent = fetchMock.mock.calls[0]?.[1]?.body?.get("smstext") ?? "";
  expect(sent).toContain("মাহিম আহম্মেদ");
  expect(sent).toContain("চার পায়ে ঝিনঝিন করছে, স্যুগার বেশি");
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ message_text: expect.stringContaining("মাহিম আহম্মেদ") }));
});

it("does not send the same booking notification twice", async () => {
  vi.stubEnv("AUTOMAS_SMS_API_KEY", "test-only-key");
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ response: [{ status: 0 }] }) }));
  const { sendDoctorBookingSms } = await import("./appointment-sms.server");
  await sendDoctorBookingSms("same-appointment");
  expect(await sendDoctorBookingSms("same-appointment")).toBe("already_submitted");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("normalizes a doctor profile Bangladesh phone and rejects missing or bulk numbers", () => {
  expect(doctorSmsPhone("+880 1772258197")).toBe("8801772258197");
  expect(doctorSmsPhone(null)).toBeNull();
  expect(doctorSmsPhone("01772258197,01772258197")).toBeNull();
});

it("keeps a long patient complaint to one bounded SMS line", () => {
  const message = appointmentSmsMessage({ slot: "2026-11-08T12:00:00Z", patientName: "রহিম", reason: `সকাল থেকে বমি বমি ভাব\n\n${"খুব দুর্বল লাগছে ".repeat(30)}` });
  expect(message).toContain("রহিম");
  expect(message).not.toContain("\n");
  expect(Array.from(message).length).toBeLessThan(320);
});
