import { BadgeCheck, Award } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function DoctorBadges({ is_verified, is_special }: { is_verified?: boolean; is_special?: boolean }) {
  const { t } = useLang();
  if (!is_verified && !is_special) return null;
  return <div className="mt-1.5 flex flex-wrap gap-2">
    {is_verified && <span className="inline-flex items-center gap-1 rounded-sm border border-primary/30 bg-secondary px-1.5 py-0.5 text-xs font-medium text-primary"><BadgeCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />{t("যাচাইকৃত", "Verified")}</span>}
    {is_special && <span className="inline-flex items-center gap-1 rounded-sm border border-accent/30 bg-card px-1.5 py-0.5 text-xs font-medium text-accent"><Award className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />{t("বিশেষ", "Special")}</span>}
  </div>;
}