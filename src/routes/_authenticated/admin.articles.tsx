import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { saveContent, fileToDataUrl } from "@/lib/cms";
import { useArticles } from "@/lib/use-articles";
import type { Article, Block } from "@/lib/articles";

export const Route = createFileRoute("/_authenticated/admin/articles")({ head: () => pageHead('Admin articles', 'Edit bilingual diabetes articles for Diacare.'), component: Page });

const inp = "mt-0.5 w-full rounded-md border border-input bg-card px-2 py-1 text-sm";
const btn = "rounded-md border border-border bg-card px-2 py-1 transition-colors duration-150 hover:bg-secondary";

// Body text format: blank line between blocks, "## " = heading, "> " = pull quote.
const toText = (body: Block[], lang: "bn" | "en") => body.map((b) => (b.kind === "h" ? "## " : b.kind === "quote" ? "> " : "") + b[lang]).join("\n\n");
function toBlocks(bn: string, en: string): Block[] {
  const split = (s: string) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const a = split(bn), b = split(en);
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => {
    const x = a[i] ?? "", y = b[i] ?? "";
    const src = x || y;
    const kind: Block["kind"] = src.startsWith("## ") ? "h" : src.startsWith("> ") ? "quote" : "p";
    const strip = (s: string) => s.replace(/^(## |> )/, "");
    return { kind, bn: strip(x) || strip(y), en: strip(y) || strip(x) };
  });
}
type Draft = Omit<Article, "body" | "author"> & { bodyBn: string; bodyEn: string; author: Article["author"]; original?: string | undefined };

function Page() {
  const { t } = useLang();
  const qc = useQueryClient();
  const list = useArticles();
  const [d, setD] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");

  async function persist(next: Article[]) {
    const { error } = await saveContent("articles", next);
    setMsg(error ? `${t("সংরক্ষণ হয়নি", "Not saved")}: ${error.message}` : t("সংরক্ষিত", "Saved"));
    qc.invalidateQueries({ queryKey: ["site-content"] });
    return !error;
  }
  function edit(a?: Article) {
    const base: Article = a ?? { slug: "", catBn: "", catEn: "", titleBn: "", titleEn: "", deckBn: "", deckEn: "", minutes: 4, date: new Date().toISOString().slice(0, 10), author: { slug: "", bn: "", en: "", roleBn: "", roleEn: "" }, body: [] };
    const { body, ...rest } = base;
    setD({ ...rest, bodyBn: toText(body, "bn"), bodyEn: toText(body, "en"), original: a?.slug });
    setMsg("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!d) return;
    if (!d.titleBn.trim() || !d.titleEn.trim()) return setMsg(t("দুই ভাষায় শিরোনাম লিখুন।", "Write the title in both languages."));
    const slug = (d.slug || d.titleEn).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `article-${Date.now()}`;
    if (list.some((a) => a.slug === slug && a.slug !== d.original)) return setMsg(t("এই ঠিকানায় আরেকটা লেখা আছে।", "Another article already uses this address."));
    const { bodyBn, bodyEn, original, ...rest } = d;
    const art: Article = { ...rest, slug, minutes: Number(d.minutes) || 1, body: toBlocks(bodyBn, bodyEn) };
    const next = original ? list.map((a) => (a.slug === original ? art : a)) : [art, ...list];
    if (await persist(next)) setD(null);
  }
  async function remove(a: Article) {
    if (!confirm(t(`"${a.titleBn}" মুছবেন?`, `Delete "${a.titleEn}"?`))) return;
    await persist(list.filter((x) => x.slug !== a.slug));
  }
  async function move(i: number, dir: -1 | 1) {
    const next = [...list]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    await persist(next);
  }
  const f = (k: keyof Draft, label: string, type = "text") => (
    <label className="block">{label}<input type={type} className={inp} value={String(d![k] ?? "")} onChange={(e) => setD({ ...d!, [k]: e.target.value })} /></label>
  );
  const fa = (k: keyof Draft["author"], label: string) => (
    <label className="block">{label}<input className={inp} value={d!.author[k]} onChange={(e) => setD({ ...d!, author: { ...d!.author, [k]: e.target.value } })} /></label>
  );
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-lg font-semibold">{t("লেখা", "Articles")} <span className="font-normal text-muted-foreground">({list.length})</span></h1>
        <button onClick={() => edit()} className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("নতুন লেখা লিখুন", "Write a new article")}</button>
      </div>
      <p className="mt-1 text-muted-foreground">{t("তালিকার প্রথম লেখাটা বড় করে দেখানো হয়।", "The first article in the list is shown large.")}</p>
      {msg && !d && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
      {d && (
        <form onSubmit={save} className="mt-4 space-y-3 rounded-[10px] border border-border bg-card p-4">
          <h2 className="font-semibold">{d.original ? t("লেখা সম্পাদনা", "Edit article") : t("নতুন লেখা", "New article")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {f("titleBn", t("শিরোনাম (বাংলা)", "Title (Bangla)"))}
            {f("titleEn", t("শিরোনাম (ইংরেজি)", "Title (English)"))}
            {f("deckBn", t("সারসংক্ষেপ (বাংলা)", "Summary (Bangla)"))}
            {f("deckEn", t("সারসংক্ষেপ (ইংরেজি)", "Summary (English)"))}
            {f("catBn", t("বিভাগ (বাংলা)", "Category (Bangla)"))}
            {f("catEn", t("বিভাগ (ইংরেজি)", "Category (English)"))}
            {fa("bn", t("লেখক (বাংলা)", "Author (Bangla)"))}
            {fa("en", t("লেখক (ইংরেজি)", "Author (English)"))}
            {fa("roleBn", t("লেখকের পরিচয় (বাংলা)", "Author role (Bangla)"))}
            {fa("roleEn", t("লেখকের পরিচয় (ইংরেজি)", "Author role (English)"))}
            {f("date", t("তারিখ", "Date"), "date")}
            {f("minutes", t("পড়তে কত মিনিট", "Reading minutes"), "number")}
            {f("slug", t("পাতার ঠিকানা (খালি রাখলে নিজে বানাবে)", "Page address (auto if empty)"))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {d.image && <img src={d.image} alt="" className="h-16 w-24 rounded-md border border-border object-cover" />}
            <label className={`${btn} cursor-pointer`}>{t("ছবি বেছে নিন", "Choose image")}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setD({ ...d, image: await fileToDataUrl(file) }); }} /></label>
            {d.image && <button type="button" onClick={() => setD({ ...d, image: "" })} className={btn}>{t("ছবি সরান", "Remove image")}</button>}
          </div>
          <p className="text-xs text-muted-foreground">{t("অনুচ্ছেদের মাঝে একটা খালি লাইন দিন। শিরোনামের আগে ## আর মূল পরামর্শের আগে > লিখুন। দুই ভাষায় অনুচ্ছেদের সংখ্যা একই রাখুন।", "Leave a blank line between paragraphs. Start a heading with ## and a key-advice quote with >. Keep the same number of paragraphs in both languages.")}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">{t("লেখা (বাংলা)", "Body (Bangla)")}<textarea rows={14} className={inp} value={d.bodyBn} onChange={(e) => setD({ ...d, bodyBn: e.target.value })} /></label>
            <label className="block">{t("লেখা (ইংরেজি)", "Body (English)")}<textarea rows={14} className={inp} value={d.bodyEn} onChange={(e) => setD({ ...d, bodyEn: e.target.value })} /></label>
          </div>
          {msg && <p className="text-destructive">{msg}</p>}
          <div className="flex gap-2">
            <button className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("লেখা প্রকাশ করুন", "Publish article")}</button>
            <button type="button" onClick={() => setD(null)} className={btn}>{t("বাতিল", "Cancel")}</button>
          </div>
        </form>
      )}
      <table className="mt-4 w-full border-collapse border border-border bg-card text-[13px]">
        <tbody>
          {list.map((a, i) => (
            <tr key={a.slug} className="border-b border-border">
              <td className="p-2 text-muted-foreground">{i + 1}</td>
              <td className="p-2"><p className="font-medium">{t(a.titleBn, a.titleEn)}</p><p className="text-muted-foreground">{t(a.catBn, a.catEn)} · {t(a.author.bn, a.author.en)} · {a.date}</p></td>
              <td className="p-2 text-right whitespace-nowrap">
                <button onClick={() => move(i, -1)} className={btn} aria-label="up">↑</button>{" "}
                <button onClick={() => move(i, 1)} className={btn} aria-label="down">↓</button>{" "}
                <button onClick={() => edit(a)} className={btn}>{t("সম্পাদনা", "Edit")}</button>{" "}
                <button onClick={() => remove(a)} className={`${btn} text-glucose-low`}>{t("মুছুন", "Delete")}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
