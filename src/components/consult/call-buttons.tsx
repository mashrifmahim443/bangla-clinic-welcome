import { Phone, Video } from "lucide-react";
import { useCms } from "@/lib/cms";
import { useLang } from "@/lib/i18n";
import { INTEGRATIONS_KEY, joinUrl, withDefaults } from "@/lib/integrations";

// Same room for doctor and patient; audio call opens with camera off.
export function CallButtons({ appointmentId }: { appointmentId: string }) {
  const { t } = useLang();
  const cms = useCms();
  const room = joinUrl(withDefaults(cms.json(INTEGRATIONS_KEY, null)).jitsi_base, `DiabeCare-${appointmentId}`);
  const cls = "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150";
  return (
    <div className="flex shrink-0 gap-2">
      <a href={room} target="_blank" rel="noreferrer" className={`${cls} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>
        <Video className="h-4 w-4" aria-hidden />{t("ভিডিও কল", "Video call")}
      </a>
      <a href={`${room}#config.startWithVideoMuted=true&config.startAudioOnly=true`} target="_blank" rel="noreferrer" className={`${cls} border-primary text-primary hover:bg-secondary`}>
        <Phone className="h-4 w-4" aria-hidden />{t("অডিও কল", "Audio call")}
      </a>
    </div>
  );
}
