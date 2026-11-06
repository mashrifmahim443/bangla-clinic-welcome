import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { fields, sections, saveContent, fileToDataUrl, useSiteContent, type Field } from "@/lib/cms";
import heroImg from "@/assets/hero-sugar-check.jpg";

export const Route = createFileRoute("/_authenticated/admin/content")({ component: Page });

const inp = "mt-0.5 w-full rounded-md border border-input bg-card px-2 py-1";
const btn = "rounded-md border border-border bg-card px-2 py-1 transition-colors duration-150 hover:bg-secondary";

function Page() {
  const { t } = useLang();
  const [sec, setSec] = useState(Object.keys(sections)[0]!);
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("সাইটের লেখা ও ছবি", "Site text & images")}</h1>
      <p className="mt-1 text-muted-foreground">{t("প্রথম পাতা আর ফুটারের যেকোনো লেখা বদলান। খালি রাখলে আগের লেখা দেখাবে।", "Change any text on the home page and footer. Leave a box empty to show the original text.")}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {Object.entries(sections).map(([k, [bn, en]]) => (
          <button key={k} onClick={() => setSec(k)} className={`rounded-md border px-2 py-1 transition-colors duration-150 ${sec === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{t(bn, en)}</button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {fields.filter((f) => f.section === sec).map((f) => <FieldEditor key={f.key} f={f} />)}
      </div>
    </div>
  );
}

function FieldEditor({ f }: { f: Field }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const all = useSiteContent();
  const saved = (all[f.key] ?? {}) as { bn?: string; en?: string; url?: string };
  const [bn, setBn] = useState(saved.bn ?? f.bn);
  const [en, setEn] = useState(saved.en ?? f.en);
  const [url, setUrl] = useState(saved.url ?? "");
  const [msg, setMsg] = useState("");
  useEffect(() => { setBn(saved.bn ?? f.bn); setEn(saved.en ?? f.en); setUrl(saved.url ?? ""); }, [saved.bn, saved.en, saved.url, f.bn, f.en]);

  async function save(data: object) {
    const { error } = await saveContent(f.key, data);
    setMsg(error ? `${t("সংরক্ষণ হয়নি", "Not saved")}: ${error.message}` : t("সংরক্ষিত", "Saved"));
    qc.invalidateQueries({ queryKey: ["site-content"] });
  }
  const Area = f.kind === "text" ? "input" : "textarea";
  const rows = f.kind === "lines" ? 6 : 3;
  return (
    <div className="rounded-[10px] border border-border bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium">{t(f.label[0], f.label[1])}</p>
        {f.hint && <p className="text-xs text-muted-foreground">{t(f.hint[0], f.hint[1])}</p>}
      </div>
      {f.kind === "image" ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <img src={url || heroImg} alt="" className="h-24 w-20 rounded-md border border-border object-cover" />
          <label className={`${btn} cursor-pointer`}>{t("নতুন ছবি বেছে নিন", "Choose new photo")}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const u = await fileToDataUrl(file); setUrl(u); save({ url: u }); } }} /></label>
          {url && <button onClick={() => { setUrl(""); save({ url: "" }); }} className={btn}>{t("আগের ছবিতে ফিরুন", "Back to original photo")}</button>}
        </div>
      ) : (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <label className="block text-xs text-muted-foreground">বাংলা<Area className={`${inp} text-sm text-foreground`} rows={rows} value={bn} onChange={(e) => setBn(e.target.value)} /></label>
          <label className="block text-xs text-muted-foreground">English<Area className={`${inp} text-sm text-foreground`} rows={rows} value={en} onChange={(e) => setEn(e.target.value)} /></label>
        </div>
      )}
      {f.kind !== "image" && (
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => save({ bn, en })} className="rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("সংরক্ষণ করুন", "Save")}</button>
          <button onClick={() => { setBn(f.bn); setEn(f.en); save({ bn: f.bn, en: f.en }); }} className={btn}>{t("আগের লেখায় ফিরুন", "Restore original")}</button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      )}
      {f.kind === "image" && msg && <p className="mt-1 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
