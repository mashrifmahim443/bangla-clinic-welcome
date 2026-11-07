export type SmsSettings = { sender_id: string; test_number: string; message_template: string };

export const defaultSmsSettings: SmsSettings = {
  sender_id: "8809617641360",
  test_number: "01772258197",
  message_template: "ডাক্তার সাহেব, আপনার নতুন অ্যাপয়েন্টমেন্ট আছে। সময়: {time}। বিস্তারিত: {link}",
};

export function smsSettingsPayload(settings: SmsSettings) {
  return {
    id: "automas" as const,
    sender_id: settings.sender_id.trim(),
    test_number: settings.test_number.trim(),
    message_template: settings.message_template.trim(),
  };
}

export function smsSettingsError(settings: SmsSettings) {
  const data = smsSettingsPayload(settings);
  if (!/^[A-Za-z0-9+_-]{3,32}$/.test(data.sender_id)) return "sender";
  if (data.test_number && !/^(01\d{9}|8801\d{9})$/.test(data.test_number)) return "number";
  if (data.message_template.length > 1000) return "message";
  return null;
}