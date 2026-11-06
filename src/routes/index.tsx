import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { formatBDT, formatNumber } from "@/lib/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImg from "@/assets/hero-sugar-check.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DiabeCare — Log your sugar, tell your doctor" },
      { name: "description", content: "Diabetes care for Bangladesh: log sugar three times a day, see BMDC-verified doctors online, and get food lists in Bangla." },
      { property: "og:title", content: "DiabeCare — Log your sugar, tell your doctor" },
      { property: "og:description", content: "Log sugar, see BMDC-verified doctors, and get Bangla food lists. Built in Dhaka." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const doctors = [
  { initials: "নই", bn: "ডা. নাসরিন ইসলাম", en: "Dr. Nasrin Islam", specBn: "এন্ডোক্রাইনোলজিস্ট", specEn: "Endocrinologist", fee: 800, online: true },
  { initials: "রহ", bn: "ডা. রফিকুল হাসান", en: "Dr. Rafiqul Hasan", specBn: "ডায়াবেটোলজিস্ট", specEn: "Diabetologist", fee: 600, online: true },
  { initials: "ফচ", bn: "ডা. ফারহানা চৌধুরী", en: "Dr. Farhana Chowdhury", specBn: "পুষ্টিবিদ", specEn: "Nutritionist", fee: 500, online: false },
  { initials: "মক", bn: "ডা. মাহমুদ করিম", en: "Dr. Mahmud Karim", specBn: "মেডিসিন বিশেষজ্ঞ", specEn: "Internal medicine", fee: 700, online: false },
];

const eat = [
  ["লাল চালের ভাত, অল্প পরিমাণে", "Red rice, small portion"],
  ["মসুর ও মুগ ডাল", "Masoor and mung dal"],
  ["লাল শাক, পুঁই শাক, কলমি শাক", "Red, malabar and water spinach"],
  ["করলা, ঢেঁড়স, লাউ", "Bitter gourd, okra, bottle gourd"],
  ["রুই, ইলিশ, কাঁচকি মাছ", "Rui, ilish, small fish"],
  ["পেয়ারা, আমড়া, জাম্বুরা", "Guava, hog plum, pomelo"],
];
const avoid = [
  ["সাদা ভাত বেশি পরিমাণে", "Large plates of white rice"],
  ["রসগোল্লা, মিষ্টি, পায়েস", "Roshogolla, mishti, payesh"],
  ["পরোটা, লুচি, সিঙ্গারা", "Paratha, luchi, shingara"],
  ["চিনি দেওয়া চা", "Tea with sugar"],
  ["পাকা আম, কাঁঠাল বেশি", "Lots of ripe mango, jackfruit"],
  ["কোমল পানীয়", "Soft drinks"],
];

function Landing() {
  const { lang, t } = useLang();

  const steps = [
    [t("অ্যাকাউন্ট খুলুন", "Open an account"), t("ফোন নম্বর বা ইমেইল দিয়ে, দুই মিনিটে।", "With your email, in two minutes.")],
    [t("দিনে তিন বেলা সুগার লিখুন", "Write your sugar three times a day"), t("সকালে খালি পেটে, দুপুরে আর রাতে খাওয়ার পরে।", "Fasting in the morning, after lunch and after dinner.")],
    [t("ডাক্তার আপনার হিসাব দেখেন", "Your doctor sees your log"), t("সপ্তাহের রিডিং একটা পাতায়, সংখ্যা আর রঙে।", "The week's readings on one page, in numbers and colour.")],
    [t("ভিডিও বা ফোনে পরামর্শ", "Advice by video or phone"), t("ওষুধ আর খাবারের তালিকা বাংলায় পাবেন।", "You get medicine and food lists in Bangla.")],
  ];

  const faqs = [
    [t("আমার গ্লুকোমিটার লাগবে?", "Do I need a glucometer?"), t("হ্যাঁ। যেকোনো ব্র্যান্ডের গ্লুকোমিটার চলবে। রিডিং হাতে লিখে দিলেই হবে।", "Yes. Any brand works. You type the reading in yourself.")],
    [t("ডাক্তাররা কি সত্যিই BMDC নিবন্ধিত?", "Are the doctors really BMDC registered?"), t("হ্যাঁ। আমরা প্রত্যেকের নিবন্ধন নম্বর যাচাই করি এবং তাদের পাতায় দেখাই।", "Yes. We check each registration number and show it on their page.")],
    [t("বিকাশ বা নগদে ফি দেওয়া যাবে?", "Can I pay with bKash or Nagad?"), t("হ্যাঁ, বিকাশ, নগদ আর কার্ড — তিনটাই চলবে।", "Yes — bKash, Nagad and card all work.")],
    [t("আমার বাবা-মায়ের হিসাব কি আমি রাখতে পারব?", "Can I keep a log for my parents?"), t("পারবেন। পরিবার প্যাকে একটা অ্যাকাউন্টে চারজন পর্যন্ত রাখা যায়।", "Yes. The family plan holds up to four people on one account.")],
    [t("সুগার খুব কমে গেলে কী করব?", "What if my sugar drops very low?"), t("৭০ mg/dL-এর নিচে হলে সঙ্গে সঙ্গে চিনি বা গ্লুকোজ খান। জ্ঞান হারালে নিকটস্থ হাসপাতালে যান।", "Below 70 mg/dL, take sugar or glucose right away. If someone faints, go to the nearest hospital.")],
  ];

  const plans: { name: string; price: number | null; rows: (string | boolean | number)[] }[] = [
    { name: t("বিনামূল্যে", "Free"), price: 0, rows: [true, false, t("সাধারণ", "Basic"), 1] },
    { name: t("মাসিক", "Monthly"), price: 499, rows: [true, t("মাসে ১ বার", "1 per month"), t("ব্যক্তিগত", "Personal"), 1] },
    { name: t("পরিবার", "Family"), price: 1199, rows: [true, t("মাসে ৩ বার", "3 per month"), t("ব্যক্তিগত", "Personal"), 4] },
  ];
  const planLabels = [
    t("সুগারের হিসাব", "Sugar log"),
    t("ডাক্তারের পরামর্শ", "Doctor consults"),
    t("খাদ্য তালিকা", "Food list"),
    t("কতজন", "People"),
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-20 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-[2.6rem] font-semibold leading-tight text-foreground md:text-[3.4rem]">
            {lang === "bn" ? (
              <>সুগারের হিসাব রাখুন।<br /><span className="hand-underline">ডাক্তারকে</span> জানান।</>
            ) : (
              <>Keep track of your sugar.<br />Tell your <span className="hand-underline">doctor</span>.</>
            )}
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            {t(
              "দিনে তিনবার রিডিং লিখুন। আপনার ডাক্তার সেটা দেখে বাংলায় পরামর্শ দেবেন।",
              "Write down your reading three times a day. Your doctor reads it and replies in plain words.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link to="/auth" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              {t("ডাক্তার দেখান", "See a doctor")}
            </Link>
            <a href="#how" className="font-medium text-primary underline underline-offset-4 hover:text-accent">
              {t("কীভাবে কাজ করে", "How it works")}
            </a>
          </div>
        </div>
        <div className="relative md:-mr-16 md:translate-y-4">
          <img
            src={heroImg}
            alt={t("খাবার টেবিলে বসে সুগার মাপছেন একজন মানুষ", "A man checking his sugar at the dining table")}
            width={1024}
            height={1280}
            className="aspect-[4/5] w-full rounded-[10px] border border-border object-cover"
          />
          <div className="absolute -bottom-6 -left-6 w-52 -rotate-2 rounded-md border border-border bg-card px-4 py-3">
            <p className="font-hand text-xl leading-tight text-muted-foreground">{t("আজকের রিডিং", "today's reading")}</p>
            <p className="font-display text-3xl font-semibold text-glucose-ok">
              {formatNumber(112, lang)} <span className="font-sans text-sm font-normal text-muted-foreground">mg/dL</span>
            </p>
            <p className="text-xs text-muted-foreground">{t("খালি পেটে, সকাল ৭:৩০", "fasting, 7:30 am")}</p>
          </div>
        </div>
      </section>

      {/* Strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl divide-border px-6 md:grid-cols-3 md:divide-x">
          {[
            [t("৩ বেলা", "3 times"), t("প্রতিদিন চেক-ইন", "daily check-in")],
            [t("৪০+", "40+"), t("BMDC যাচাইকৃত ডাক্তার", "BMDC-verified doctors")],
            [t("১০০%", "100%"), t("বাংলায় খাদ্য তালিকা", "food lists in Bangla")],
          ].map(([big, small]) => (
            <div key={small} className="py-8 md:px-8 first:md:pl-0">
              <p className="font-display text-4xl font-semibold text-primary">{big}</p>
              <p className="mt-1 text-muted-foreground">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-[1fr_2fr]">
        <h2 className="font-display text-4xl font-semibold">{t("কীভাবে কাজ করে", "How it works")}</h2>
        <ol className="divide-y divide-border">
          {steps.map(([title, body], i) => (
            <li key={i} className="flex gap-8 py-6 first:pt-0">
              <span className="font-display w-14 shrink-0 text-6xl font-semibold leading-none text-accent">
                {formatNumber(i + 1, lang)}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Doctors */}
      <section id="doctors" className="border-t border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-semibold">{t("আমাদের ডাক্তার", "Our doctors")}</h2>
            <Link to="/auth" className="font-medium text-primary underline underline-offset-4">{t("সব ডাক্তার দেখুন", "See all doctors")}</Link>
          </div>
          <div className="mt-8 overflow-hidden rounded-[10px] border border-border bg-card">
            <div className="hidden grid-cols-[3.5rem_2fr_1.5fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-sm text-muted-foreground md:grid">
              <span />
              <span>{t("নাম", "Name")}</span>
              <span>{t("বিশেষত্ব", "Specialty")}</span>
              <span>{t("ফি", "Fee")}</span>
              <span>{t("অবস্থা", "Status")}</span>
            </div>
            {doctors.map((d) => (
              <div key={d.en} className="grid grid-cols-[3.5rem_1fr] items-center gap-x-4 gap-y-1 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[3.5rem_2fr_1.5fr_1fr_1fr]">
                <div className="row-span-3 flex h-12 w-12 items-center justify-center rounded-md bg-secondary font-bn font-semibold text-primary md:row-span-1">
                  {d.initials}
                </div>
                <p className="font-semibold">{t(d.bn, d.en)}</p>
                <p className="text-muted-foreground">{t(d.specBn, d.specEn)}</p>
                <p>{formatBDT(d.fee, lang)}</p>
                <p className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${d.online ? "bg-glucose-ok" : "bg-border"}`} />
                  {d.online ? t("এখন অনলাইনে", "Online now") : t("অফলাইন", "Offline")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Food */}
      <section id="food" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl font-semibold">{t("কী খাবেন, কী এড়াবেন", "What to eat, what to avoid")}</h2>
        <p className="mt-2 max-w-lg text-muted-foreground">{t("ঘরের খাবার দিয়েই শুরু। পরিমাণটাই আসল।", "Start with home food. Portion is what matters.")}</p>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          {[
            { title: t("খাবেন", "Eat"), list: eat, color: "text-glucose-ok" },
            { title: t("এড়াবেন", "Avoid"), list: avoid, color: "text-glucose-low" },
          ].map((col) => (
            <div key={col.title}>
              <h3 className={`border-b-2 border-current pb-2 text-2xl font-semibold ${col.color}`}>{col.title}</h3>
              <ul className="divide-y divide-border">
                {col.list.map(([bn, en]) => (
                  <li key={en} className="py-3">{t(bn, en)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl font-semibold">{t("ফি", "Pricing")}</h2>
          <p className="mt-2 text-muted-foreground">{t("মাসিক, টাকায়। যেকোনো সময় বন্ধ করা যায়।", "Monthly, in taka. Stop any time.")}</p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[540px] border border-border bg-card text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 font-normal text-muted-foreground" />
                  {plans.map((p) => (
                    <th key={p.name} className="p-4 align-bottom">
                      <span className="block text-lg font-semibold">{p.name}</span>
                      <span className="font-display text-2xl font-semibold text-primary">{formatBDT(p.price ?? 0, lang)}</span>
                      <span className="text-sm font-normal text-muted-foreground"> / {t("মাস", "month")}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planLabels.map((label, r) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <td className="p-4 text-muted-foreground">{label}</td>
                    {plans.map((p) => {
                      const v = p.rows[r];
                      const text = v === true ? t("আছে", "Yes") : v === false || v === undefined ? "—" : typeof v === "number" ? formatNumber(v, lang) : v;
                      return <td key={p.name} className="p-4">{text}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 md:grid-cols-[1fr_2fr]">
        <h2 className="font-display text-4xl font-semibold">{t("সাধারণ প্রশ্ন", "Questions")}</h2>
        <Accordion type="single" collapsible className="border-t border-border">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-border">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">{q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <SiteFooter />
    </div>
  );
}
