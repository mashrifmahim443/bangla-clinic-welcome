import type { AppRole } from "@/lib/roles";

export type PopupAudience = "doctor" | "patient" | "both";
export function popupMatchesRole(audience: PopupAudience, role: AppRole) {
  return role !== "admin" && (audience === "both" || audience === role);
}
export function unreadPopups<T extends { id: string; active: boolean; audience: PopupAudience }>(messages: T[], dismissed: string[], role: AppRole) {
  const seen = new Set(dismissed);
  return messages.filter(message => message.active && popupMatchesRole(message.audience, role) && !seen.has(message.id));
}