export function smsDeliveryState(providerStatus: number | null, recipientConfirmed = false) {
  if (recipientConfirmed) return "recipient_confirmed";
  if (providerStatus === 0) return "accepted";
  if (providerStatus !== null) return "failed";
  return "unknown";
}