import { createFileRoute } from "@tanstack/react-router";
import clinicVisit from "@/assets/clinic-visit.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "সবুজ ডায়াবেটিস ক্লিনিক — ধানমন্ডি, ঢাকা" },
      { name: "description", content: "ধানমন্ডির ছোট একটি ডায়াবেটিস ক্লিনিক। সুগার মাপা, খাবারের পরামর্শ আর নিয়মিত ডাক্তার দেখানো, এক জায়গায়।" },
      { property: "og:title", content: "সবুজ ডায়াবেটিস ক্লিনিক — ধানমন্ডি, ঢাকা" },
      { property: "og:description", content: "সুগার মাপা, খাবারের পরামর্শ আর নিয়মিত ডাক্তার দেখানো।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  ["ফোন করুন বা চলে আসুন", "সকাল ৯টা থেকে রাত ৮টা। শুক্রবার বিকেল ৪টার পর।"],
  ["খালি পেটে সুগার মাপা", "সকালে না খেয়ে আসবেন। ৫ মিনিটে রিপোর্ট।"],
  ["ডাক্তারের সাথে কথা", "আগের রিপোর্ট আর ওষুধের পাতা সাথে আনবেন।"],
  ["খাবারের তালিকা", "ভাত, ডাল, শাক বাদ না দিয়েই কীভাবে খাবেন, পুষ্টিবিদ বুঝিয়ে দেবেন।"],
];

const fees = [
  ["খালি পেটে সুগার (FBS)", "১৫ মিনিট", "৳ ১৫০"],
  ["HbA1c (তিন মাসের গড়)", "একই দিন", "৳ ৯৫০"],
  ["ডাক্তার দেখানো (প্রথমবার)", "২০ মিনিট", "৳ ৭০০"],
  ["ফলো-আপ (৩০ দিনের মধ্যে)", "১৫ মিনিট", "৳ ৪০০"],
  ["পুষ্টিবিদের পরামর্শ", "৩০ মিনিট", "৳ ৫০০"],
];

const ranges = [
  ["কম", "৭০ mg/dL এর নিচে", "text-glucose-low"],
  ["ঠিক আছে (খালি পেটে)", "৮০–১৩০ mg/dL", "text-glucose-ok"],
  ["বেশি", "১৮০ mg/dL এর উপরে (খাওয়ার ২ ঘণ্টা পর)", "text-glucose-high"],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-display text-xl text-primary">সবুজ ডায়াবেটিস ক্লিনিক</a>
          <a href="tel:+8801711000000" className="font-en text-sm text-muted-foreground hover:text-primary">০১৭১১-০০০০০০</a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="text-sm text-muted-foreground">ধানমন্ডি ২৭, ঢাকা · ২০১১ সাল থেকে</p>
            <h1 className="mt-4 text-4xl text-foreground md:text-5xl">
              সুগার নিয়ে চিন্তা? <span className="hand-underline">নিয়মিত</span> দেখালেই অনেকটা সহজ।
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              আমরা ছোট একটা ক্লিনিক। দুজন ডাক্তার, একজন পুষ্টিবিদ আর একটা ল্যাব। আপনাকে নাম ধরে চিনি, তাড়াহুড়ো করি না।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="tel:+8801711000000" className="rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground hover:opacity-90">সিরিয়াল দিন</a>
              <a href="#fees" className="rounded-md border border-primary px-5 py-3 font-medium text-primary hover:bg-secondary">খরচ দেখুন</a>
            </div>
          </div>
          <figure>
            <img src={clinicVisit} alt="ক্লিনিকে ডাক্তার এক বয়স্ক রোগীর সুগার মাপছেন" width={1280} height={960} className="rounded-lg border" />
            <figcaption className="mt-2 font-hand text-xl text-muted-foreground">রহিম চাচা, প্রতি মাসের প্রথম শনিবার আসেন</figcaption>
          </figure>
        </section>

        <section className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1fr_2fr]">
            <h2 className="text-3xl">প্রথম দিন কী হয়</h2>
            <ol className="divide-y">
              {steps.map(([t, d], i) => (
                <li key={t} className="flex gap-6 py-5">
                  <span className="font-display text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-xl">{t}</h3>
                    <p className="text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="fees" className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-3xl">খরচ কত</h2>
            <p className="mt-2 text-muted-foreground">লুকানো কোনো চার্জ নেই। যা লেখা, তাই।</p>
            <table className="mt-6 w-full border bg-card text-left">
              <thead className="bg-secondary text-sm text-muted-foreground">
                <tr><th className="p-3 font-medium">সেবা</th><th className="p-3 font-medium">সময়</th><th className="p-3 text-right font-medium">ফি</th></tr>
              </thead>
              <tbody>
                {fees.map(([s, t, f]) => (
                  <tr key={s} className="border-t"><td className="p-3">{s}</td><td className="p-3 text-muted-foreground">{t}</td><td className="p-3 text-right font-en font-medium">{f}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="self-start rounded-lg border bg-card p-6">
            <h3 className="text-xl">সুগার কত হলে কী</h3>
            <ul className="mt-4 space-y-3">
              {ranges.map(([l, v, c]) => (
                <li key={l}><span className={`font-medium ${c}`}>{l}</span><br /><span className="font-en text-sm text-muted-foreground">{v}</span></li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">এটা সাধারণ হিসাব। আপনার জন্য ঠিক কত, ডাক্তার বলে দেবেন।</p>
          </aside>
        </section>

        <section className="bg-primary text-primary-foreground">
          <blockquote className="mx-auto max-w-4xl px-6 py-20">
            <p className="font-display text-3xl leading-snug md:text-4xl">
              “আগে ভাবতাম ডায়াবেটিস মানে ভাত বন্ধ। ডাক্তার আপা বললেন, ভাত খান, শুধু পরিমাণটা বুঝে। ছয় মাসে HbA1c ৯.১ থেকে ৬.৮।”
            </p>
            <footer className="mt-6 opacity-80">— নাসরিন আক্তার, মিরপুর</footer>
          </blockquote>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <p className="font-display text-lg text-foreground">সবুজ ডায়াবেটিস ক্লিনিক</p>
            <p>বাড়ি ১২, রোড ২৭ (পুরাতন), ধানমন্ডি, ঢাকা ১২০৯</p>
          </div>
          <div>
            <p>ফোন: <a href="tel:+8801711000000" className="font-en hover:text-primary">০১৭১১-০০০০০০</a></p>
            <p>শনি–বৃহস্পতি সকাল ৯টা–রাত ৮টা</p>
          </div>
          <p>আমাদের সব ডাক্তার BMDC নিবন্ধিত। রেজিস্ট্রেশন নম্বর চেম্বারে টাঙানো আছে, bmdc.org.bd তে মিলিয়ে নিতে পারেন।</p>
        </div>
      </footer>
    </div>
  );
}
