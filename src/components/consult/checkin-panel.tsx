import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { checkinSms, currentSlot } from "@/lib/checkin";

export function CheckinPanel() {
  const { t } = useLang();
  const [sms, setSms] = useState("");
  const [busy, setBusy] = useState(false);
  async function make() {
    setBusy(true);
    const slot = currentSlot(new Date());
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("checkin_links").insert({ slot }).select("token").single();
    setBusy(false);
    if (error) return alert(t("লিংক বানানো যায়নি।", "Couldn't create the link."));
    const name = String(u.user?.user_metadata?.full_name ?? "").split(" ")[0] ?? "";
    setSms(checkinSms(name, slot, `${window.location.origin}/checkin/${data.token}`));
  }
  return (
    <section className="mt-10 rounded-[10px] border border-border bg-card p-6">
      <h2 className="font-display text-xl font-semibold">{t("মেসেজে সুগার লেখা", "Check in by message")}</h2>
      <p className="mt-1 text-muted-foreground">{t("বাবা-মায়ের ফোনে এই লিংক পাঠান। তাঁরা বড় বোতাম চেপে সুগার লিখতে পারবেন, লগইন লাগবে না।", "Send this link to a parent's phone. They can log sugar with big buttons, no sign-in needed.")}</p>
      {!sms ? (
        <button onClick={make} disabled={busy} className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("চেক-ইন লিংক বানান", "Create check-in link")}</button>
      ) : (
        <>
          <p className="mt-4 rounded-md border border-border bg-background p-4 font-bn">{sms}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a href={`https://wa.me/?text=${encodeURIComponent(sms)}`} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">{t("হোয়াটসঅ্যাপে পাঠান", "Send on WhatsApp")}</a>
            <a href={`sms:?&body=${encodeURIComponent(sms)}`} className="text-primary underline underline-offset-4">{t("এসএমএস পাঠান", "Send by SMS")}</a>
            <button onClick={() => navigator.clipboard.writeText(sms)} className="text-primary underline underline-offset-4">{t("কপি করুন", "Copy")}</button>
          </div>
        </>
      )}
    </section>
  );
}
