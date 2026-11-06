import { useLang } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold text-primary">ডায়াবিকেয়ার / DiabeCare</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫", "House 12, Road 5, Dhanmondi, Dhaka 1205")}
            <br />
            {t("ফোন:", "Phone:")} +880 1711-000000
            <br />
            {t("শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা", "Sat–Thu, 9am – 9pm")}
          </p>
        </div>
        <ul className="space-y-1.5 text-sm">
          <li><a href="/#how" className="hover:text-primary">{t("কীভাবে কাজ করে", "How it works")}</a></li>
          <li><a href="/doctors" className="hover:text-primary">{t("ডাক্তার", "Doctors")}</a></li>
          <li><a href="/subscription" className="hover:text-primary">{t("ফি", "Pricing")}</a></li>
          <li><a href="/#faq" className="hover:text-primary">{t("প্রশ্ন", "FAQ")}</a></li>
        </ul>
        <p className="text-sm text-muted-foreground">
          {t(
            "সব ডাক্তার BMDC নিবন্ধিত। নিবন্ধন নম্বর প্রত্যেক ডাক্তারের পাতায় দেওয়া আছে।",
            "Every doctor is BMDC registered. Registration numbers are on each doctor's page.",
          )}
        </p>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-6 py-5 text-sm font-medium text-accent">
          {t("জরুরি অবস্থায় এই প্ল্যাটফর্ম হাসপাতালের বিকল্প নয়।", "In an emergency, this platform is not a substitute for a hospital.")}
        </p>
      </div>
    </footer>
  );
}
