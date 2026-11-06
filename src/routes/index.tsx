import { createFileRoute } from "@tanstack/react-router";
import clinicVisit from "@/assets/clinic-visit.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shobuj Diabetes Clinic — Dhanmondi, Dhaka" },
      { name: "description", content: "A small diabetes clinic in Dhanmondi. Sugar tests, meal advice and regular doctor visits, all in one place." },
      { property: "og:title", content: "Shobuj Diabetes Clinic — Dhanmondi, Dhaka" },
      { property: "og:description", content: "Sugar tests, meal advice and regular doctor visits, all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  ["Call or walk in", "9 am to 8 pm. Closed after 4 pm on Friday."],
  ["Fasting sugar test", "Come without eating in the morning. Report in 5 minutes."],
  ["Talk with the doctor", "Bring your old reports and your medicine papers."],
  ["A meal plan", "A nutritionist shows you how to keep eating rice, dal and shak — just in the right amounts."],
];

const fees = [
  ["Fasting blood sugar (FBS)", "15 minutes", "৳ 150"],
  ["HbA1c (3-month average)", "Same day", "৳ 950"],
  ["Doctor visit (first time)", "20 minutes", "৳ 700"],
  ["Follow-up (within 30 days)", "15 minutes", "৳ 400"],
  ["Nutrition counselling", "30 minutes", "৳ 500"],
];

const ranges = [
  ["Low", "below 70 mg/dL", "text-glucose-low"],
  ["In range (fasting)", "80–130 mg/dL", "text-glucose-ok"],
  ["High", "above 180 mg/dL (2 hours after eating)", "text-glucose-high"],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="font-display text-xl text-primary">Shobuj Diabetes Clinic</a>
          <a href="tel:+8801711000000" className="font-en text-sm text-muted-foreground hover:text-primary">01711-000000</a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="text-sm text-muted-foreground">Dhanmondi 27, Dhaka · Since 2011</p>
            <h1 className="mt-4 text-4xl text-foreground md:text-5xl">
              Worried about your sugar? <span className="hand-underline">Regular</span> check-ups make most of it simpler.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              We are a small clinic. Two doctors, one nutritionist and one lab. We know you by name, not by token number.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="tel:+8801711000000" className="rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground hover:opacity-90">Book a slot</a>
              <a href="#fees" className="rounded-md border border-primary px-5 py-3 font-medium text-primary hover:bg-secondary">See the fees</a>
            </div>
          </div>
          <figure>
            <img src={clinicVisit} alt="A doctor checking an older patient's sugar at the clinic" width={1280} height={960} className="rounded-lg border" />
            <figcaption className="mt-2 font-hand text-xl text-muted-foreground">Rahim Chacha comes every first Saturday of the month</figcaption>
          </figure>
        </section>

        <section className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1fr_2fr]">
            <h2 className="text-3xl">What happens on your first day</h2>
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
            <h2 className="text-3xl">What it costs</h2>
            <p className="mt-2 text-muted-foreground">No hidden charges. What is written here is what you pay.</p>
            <table className="mt-6 w-full border bg-card text-left">
              <thead className="bg-secondary text-sm text-muted-foreground">
                <tr><th className="p-3 font-medium">Service</th><th className="p-3 font-medium">Time</th><th className="p-3 text-right font-medium">Fee</th></tr>
              </thead>
              <tbody>
                {fees.map(([s, t, f]) => (
                  <tr key={s} className="border-t"><td className="p-3">{s}</td><td className="p-3 text-muted-foreground">{t}</td><td className="p-3 text-right font-en font-medium">{f}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="self-start rounded-lg border bg-card p-6">
            <h3 className="text-xl">What your sugar number means</h3>
            <ul className="mt-4 space-y-3">
              {ranges.map(([l, v, c]) => (
                <li key={l}><span className={`font-medium ${c}`}>{l}</span><br /><span className="font-en text-sm text-muted-foreground">{v}</span></li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">This is a general guide. Your doctor will tell you the number that is right for you.</p>
          </aside>
        </section>

        <section className="bg-primary text-primary-foreground">
          <blockquote className="mx-auto max-w-4xl px-6 py-20">
            <p className="font-display text-3xl leading-snug md:text-4xl">
              “I used to think diabetes meant giving up rice. The doctor told me, eat rice, just understand the amount. In six months my HbA1c came down from 9.1 to 6.8.”
            </p>
            <footer className="mt-6 opacity-80">— Nasrin Akter, Mirpur</footer>
          </blockquote>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <p className="font-display text-lg text-foreground">Shobuj Diabetes Clinic</p>
            <p>House 12, Road 27 (Old), Dhanmondi, Dhaka 1209</p>
          </div>
          <div>
            <p>Phone: <a href="tel:+8801711000000" className="font-en hover:text-primary">01711-000000</a></p>
            <p>Sat–Thu, 9 am – 8 pm</p>
          </div>
          <p>Every doctor here is BMDC registered. The registration numbers are hung in the chamber, and you can check them at bmdc.org.bd.</p>
        </div>
      </footer>
    </div>
  );
}
