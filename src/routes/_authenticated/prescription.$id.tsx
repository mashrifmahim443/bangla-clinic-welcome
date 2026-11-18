import { pageHead } from "@/lib/appointments";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import { useAppointment, usePrescription } from "@/lib/consult";
import { medicineTimingText } from "@/lib/medicine";

export const Route = createFileRoute("/_authenticated/prescription/$id")({
  head: () => pageHead('Patient prescription', 'Read and print your private Diacare doctor prescription.'),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const { data: appt, isLoading } = useAppointment(id);
  const { data: rx, isLoading: l2 } = usePrescription(id);
  if (isLoading || l2) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  if (!appt) return <p className="p-10">{t("এই অ্যাপয়েন্টমেন্টটা খুঁজে পাওয়া গেল না।", "We couldn't find this appointment.")}</p>;
  const d = appt.doctors;
  const date = formatDhaka(new Date(rx?.created_at ?? appt.slot_start), lang, { dateStyle: "long" });

  return (
    <div className="min-h-screen px-4 py-8 print:p-0">
      <div className="mx-auto mb-4 flex max-w-[52rem] justify-between text-sm print:hidden">
        <Link to="/consult/$id" params={{ id }} className="text-primary underline underline-offset-4">{t("← কক্ষে ফিরুন", "← Back to room")}</Link>
        <button onClick={() => window.print()} className="rounded-md border border-border bg-card px-3 py-1.5 transition-colors duration-150 hover:bg-secondary">{t("প্রিন্ট করুন", "Print")}</button>
      </div>
      <article className="mx-auto max-w-[52rem] border border-border bg-card font-display text-foreground print:border-0">
        <header className="flex justify-between gap-6 border-b-2 border-primary px-10 pt-8 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-primary">{t(d?.name_bn ?? "", d?.name_en ?? "")}</h1>
            <p className="mt-1">{d?.degrees}</p>
            <p className="text-sm text-muted-foreground">{d?.specialty}</p>
            <p className="mt-1 text-sm">BMDC Reg. No: <span className="font-semibold">{d?.bmdc_no}</span></p>
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-semibold">ডায়াকেয়ার</p>
            <p>Diacare Online Chamber</p>
            <p className="text-muted-foreground">{t("ধানমন্ডি, ঢাকা", "Dhanmondi, Dhaka")}</p>
          </div>
        </header>
        <div className="flex flex-wrap gap-x-10 gap-y-1 border-b border-border px-10 py-3 text-sm">
          <p>{t("নাম", "Name")}: <span className="border-b border-dotted border-foreground px-2">{appt.patient?.full_name ?? "—"}</span></p>
          <p>{t("তারিখ", "Date")}: <span className="border-b border-dotted border-foreground px-2">{date}</span></p>
        </div>
        <div className="grid min-h-[32rem] md:grid-cols-[14rem_1fr]">
          <div className="border-b border-border px-6 py-6 text-sm md:border-r md:border-b-0">
            <p className="font-semibold">C/C</p>
            <p className="mt-1 whitespace-pre-wrap">{rx?.chief_complaints || "—"}</p>
          </div>
          <div className="px-8 py-6">
            <p className="text-5xl leading-none font-semibold text-primary" aria-label="Rx">℞</p>
            {!rx || rx.items.length === 0 ? (
              <p className="mt-6 text-muted-foreground">{t("ডাক্তার এখনো প্রেসক্রিপশন লেখেননি।", "The doctor hasn't written the prescription yet.")}</p>
            ) : (
              <table className="mt-4 w-full text-left">
                <thead className="text-sm text-muted-foreground">
                  <tr className="border-b border-border"><th className="py-2 font-normal">#</th><th className="font-normal">{t("ওষুধ", "Medicine")}</th><th className="font-normal">{t("মাত্রা", "Dose")}</th><th className="font-normal">{t("কখন", "When")}</th><th className="font-normal">{t("কতদিন", "Duration")}</th></tr>
                </thead>
                <tbody>
                  {rx.items.map((m, i) => (
                    <tr key={i} className="border-b border-border align-top">
                      <td className="py-3 pr-2">{i + 1}.</td>
                      <td className="py-3 pr-3 break-words"><span className="font-semibold">{m.name}</span>{m.comment && <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{t("মন্তব্য", "Comment")}: {m.comment}</p>}</td>
                      <td className="py-3 pr-3">{m.dose}</td>
                      <td className="py-3 pr-3">{medicineTimingText(m, t)}</td>
                      <td className="py-3">{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {rx?.advice && (<><p className="mt-8 font-semibold">{t("পরামর্শ", "Advice")}</p><p className="mt-1 whitespace-pre-wrap">{rx.advice}</p></>)}
            {rx?.follow_up_date && (
              <p className="mt-6">{t("আবার দেখাবেন", "Follow-up")}: <span className="font-semibold">{formatDhaka(new Date(rx.follow_up_date + "T00:00:00+06:00"), lang, { dateStyle: "long" })}</span></p>
            )}
          </div>
        </div>
        <footer className="flex items-end justify-between border-t border-border px-10 py-6 text-sm">
          <p className="max-w-sm text-muted-foreground">{t("জরুরি অবস্থায় এই প্ল্যাটফর্ম হাসপাতালের বিকল্প নয়।", "In an emergency, this platform is not a substitute for a hospital.")}</p>
          <div className="text-center"><div className="w-44 border-t border-foreground" /><p className="mt-1">{t("ডাক্তারের স্বাক্ষর", "Doctor's signature")}</p></div>
        </footer>
      </article>
    </div>
  );
}
