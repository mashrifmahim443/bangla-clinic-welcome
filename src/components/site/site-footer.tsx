import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";

export function SiteFooter() {
  const { t } = useLang();
  const { c } = useCms();
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold text-primary">ডায়াকেয়ার / Diacare</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {c("footer.address")}
            <br />
            {t("ফোন:", "Phone:")} {c("footer.phone")}
            <br />
            {c("footer.hours")}
          </p>
        </div>
        <ul className="space-y-1.5 text-sm">
          <li><a href="/#how" className="hover:text-primary">{t("কীভাবে কাজ করে", "How it works")}</a></li>
          <li><a href="/doctors" className="hover:text-primary">{t("ডাক্তার", "Doctors")}</a></li>
          <li><a href="/subscription" className="hover:text-primary">{t("ফি", "Pricing")}</a></li>
          <li><a href="/#faq" className="hover:text-primary">{t("প্রশ্ন", "FAQ")}</a></li>
        </ul>
        <p className="text-sm text-muted-foreground">
          {c("footer.bmdc")}
        </p>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-6 py-5 text-sm font-medium text-accent">
          {c("footer.emergency")}
        </p>
      </div>
    </footer>
  );
}
