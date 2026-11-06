import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppointmentList } from "@/components/consult/appointment-list";
import { CheckinPanel } from "@/components/consult/checkin-panel";
import { RoleShell } from "@/components/site/role-shell";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { RANGE_HIGH, RANGE_LOW, countToday, glucoseState, statusSentence } from "@/lib/glucose";

export const Route = createFileRoute("/_authenticated/patient")({
  head: () => ({ meta: [{ title: "My sugar diary — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type ReadingType = "fasting" | "before_meal" | "after_meal" | "bedtime" | "random";
const typeLabels: Record<ReadingType, [string, string]> = {
  fasting: ["খালি পেটে", "Fasting"],
  before_meal: ["খাওয়ার আগে", "Before meal"],
  after_meal: ["খাওয়ার ২ ঘণ্টা পরে", "2h after meal"],
  bedtime: ["ঘুমানোর আগে", "Bedtime"],
  random: ["যেকোনো সময়", "Any time"],
};
const stateClass = { low: "text-glucose-low", ok: "text-glucose-ok", high: "text-glucose-high" };

function useReadings() {
  return useQuery({
    queryKey: ["readings"],
    queryFn: async () => {
      const since = new Date(Date.now() - 14 * 864e5).toISOString();
      const { data, error } = await supabase
        .from("glucose_readings")
        .select("id, value_mgdl, reading_type, note, taken_at")
        .gte("taken_at", since)
        .order("taken_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function Page() {
  const { lang, t } = useLang();
  const { data: readings = [], isLoading } = useReadings();
  const now = new Date();
  const today = countToday(readings.map((r) => new Date(r.taken_at)), now);
  const chartData = [...readings].reverse().map((r) => ({ ts: new Date(r.taken_at).getTime(), v: r.value_mgdl }));
  const inRange = readings.filter((r) => glucoseState(r.value_mgdl) === "ok").length;
  const avg = readings.length ? Math.round(readings.reduce((s, r) => s + r.value_mgdl, 0) / readings.length) : null;

  return (
    <RoleShell role="patient">
      <header className="border-b border-border pb-5">
        <p className="text-sm text-muted-foreground">{t("আমার সুগারের খাতা", "My sugar diary")}</p>
        <h1 className="font-display text-3xl font-semibold">{formatDhaka(now, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h1>
        <p className={`mt-1 text-lg ${today >= 3 ? "text-glucose-ok" : "text-accent"}`}>{statusSentence(today, lang)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("গত ১৪ দিন", "Last 14 days")}: {formatNumber(readings.length, lang)} {t("টি রিডিং", "readings")}
          {avg !== null && <> · {t("গড়", "average")} {formatNumber(avg, lang)} mg/dL · {t("সীমার মধ্যে", "in range")} {formatNumber(Math.round((inRange / readings.length) * 100), lang)}%</>}
        </p>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="rounded-[10px] border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold">{t("গত ১৪ দিনের সুগার", "Sugar, last 14 days")}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="mr-1.5 inline-block h-3 w-5 border border-glucose-ok/40 bg-glucose-ok/10 align-middle" />
              {t(`স্বাভাবিক সীমা ${formatNumber(RANGE_LOW, "bn")}–${formatNumber(RANGE_HIGH, "bn")} mg/dL`, `Target range ${RANGE_LOW}–${RANGE_HIGH} mg/dL`)}
            </p>
          </div>
          <div className="mt-4 h-72">
            {chartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-muted-foreground">{isLoading ? t("লোড হচ্ছে…", "Loading…") : t("এখনো কোনো রিডিং নেই। ডান পাশে প্রথমটা লিখুন।", "No readings yet. Write your first one on the right.")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <ReferenceArea y1={RANGE_LOW} y2={RANGE_HIGH} fill="var(--glucose-ok)" fillOpacity={0.08} stroke="var(--glucose-ok)" strokeOpacity={0.25} />
                  <XAxis
                    dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) => formatDhaka(new Date(v), lang, { day: "numeric", month: "short" })}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)"
                    label={{ value: t("তারিখ", "Date"), position: "insideBottom", offset: -16, fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    domain={[40, (max: number) => Math.max(250, Math.ceil(max / 50) * 50)]}
                    tickFormatter={(v: number) => formatNumber(v, lang)}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)" width={56}
                    label={{ value: "mg/dL", angle: -90, position: "insideLeft", fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    labelFormatter={(v: number) => formatDhaka(new Date(v), lang)}
                    formatter={(v: number) => [`${formatNumber(v, lang)} mg/dL`, t("সুগার", "Sugar")]}
                    contentStyle={{ border: "1px solid var(--border)", borderRadius: 6, boxShadow: "none" }}
                  />
                  <Line type="linear" dataKey="v" stroke="var(--primary)" strokeWidth={1.75} dot={{ r: 3, fill: "var(--primary)" }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <AddReading />
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t("সাম্প্রতিক রিডিং", "Recent readings")}</h2>
        <div className="mt-3 overflow-x-auto rounded-[10px] border border-border bg-card">
          <table className="w-full min-w-[560px] text-left">
            <thead className="border-b border-border text-sm text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-normal">{t("সময়", "Time")}</th>
                <th className="px-4 py-2.5 font-normal">{t("মান", "Value")}</th>
                <th className="px-4 py-2.5 font-normal">{t("ধরন", "Type")}</th>
                <th className="px-4 py-2.5 font-normal">{t("নোট", "Note")}</th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-muted-foreground">{t("এখনো কিছু লেখা হয়নি।", "Nothing written yet.")}</td></tr>
              )}
              {readings.slice(0, 20).map((r) => {
                const s = glucoseState(r.value_mgdl);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 whitespace-nowrap">{formatDhaka(new Date(r.taken_at), lang, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                    <td className={`px-4 py-2.5 font-semibold whitespace-nowrap ${stateClass[s]}`}>
                      {formatNumber(r.value_mgdl, lang)} <span className="text-sm font-normal text-muted-foreground">mg/dL</span>
                      {s !== "ok" && <span className="ml-2 text-sm font-normal">{s === "low" ? t("কম", "low") : t("বেশি", "high")}</span>}
                    </td>
                    <td className="px-4 py-2.5">{t(...typeLabels[r.reading_type as ReadingType])}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    <CheckinPanel />
      <AppointmentList as="patient" />
      </RoleShell>
  );
}

function AddReading() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [value, setValue] = useState("");
  const [type, setType] = useState<ReadingType>("fasting");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (input: { value_mgdl: number; reading_type: ReadingType; note: string | null }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("glucose_readings").insert({ ...input, user_id: u.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setValue(""); setNote("");
      qc.invalidateQueries({ queryKey: ["readings"] });
    },
    onError: () => setErr(t("সেভ হলো না। আবার চেষ্টা করুন।", "Couldn't save. Please try again.")),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))));
    const parsed = z.object({
      value_mgdl: z.number().int(t("পূর্ণ সংখ্যা লিখুন।", "Enter a whole number.")).min(20, t("সংখ্যাটা ২০ থেকে ৬০০-র মধ্যে হতে হবে।", "Must be between 20 and 600.")).max(600, t("সংখ্যাটা ২০ থেকে ৬০০-র মধ্যে হতে হবে।", "Must be between 20 and 600.")),
      note: z.string().trim().max(200, t("নোট ২০০ অক্ষরের মধ্যে রাখুন।", "Keep the note under 200 characters.")),
    }).safeParse({ value_mgdl: value === "" ? NaN : num, note });
    if (!parsed.success) { setErr(value === "" ? t("সুগারের মান লিখুন।", "Enter your sugar value.") : parsed.error.issues[0]!.message); return; }
    setErr(null);
    save.mutate({ value_mgdl: parsed.data.value_mgdl, reading_type: type, note: parsed.data.note || null });
  }

  const input = "w-full rounded-md border border-border bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring/30";
  return (
    <form onSubmit={submit} noValidate className="rounded-[10px] border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">{t("নতুন রিডিং", "New reading")}</h2>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium">{t("সুগার (mg/dL)", "Sugar (mg/dL)")}</span>
        <input className={`${input} ${err ? "border-destructive" : ""}`} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="112" />
      </label>
      {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium">{t("কখন মাপলেন", "When")}</span>
        <select className={input} value={type} onChange={(e) => setType(e.target.value as ReadingType)}>
          {(Object.keys(typeLabels) as ReadingType[]).map((k) => <option key={k} value={k}>{t(...typeLabels[k])}</option>)}
        </select>
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium">{t("নোট (ইচ্ছা হলে)", "Note (optional)")}</span>
        <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("যেমন: দুপুরে বিরিয়ানি", "e.g. biryani at lunch")} />
      </label>
      <button disabled={save.isPending} className="mt-4 w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {save.isPending ? t("সেভ হচ্ছে…", "Saving…") : t("সুগার লিখুন", "Write it down")}
      </button>
    </form>
  );
}
