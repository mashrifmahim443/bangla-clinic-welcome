import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";

const BUCKET = "old-prescriptions";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "pdf"];

/** Only JPG, JPEG, PNG or PDF — checked by both MIME type and file extension. */
export function isAllowedDocumentFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_TYPES.includes(file.type) && ALLOWED_EXTS.includes(ext);
}

/** Previous (paper) prescriptions a patient uploaded. Pass patientId to show read-only to their doctor. */
export function OldPrescriptions({ patientId, kind = "prescription" }: { patientId?: string; kind?: "prescription" | "test_report" }) {
  const { lang, t } = useLang();
  const rep = kind === "test_report";
  const qc = useQueryClient();
  const readOnly = !!patientId;
  const { data = [], isLoading } = useQuery({
    queryKey: ["old-rx", kind, patientId ?? "me"],
    queryFn: async () => {
      const uid = patientId ?? (await supabase.auth.getUser()).data.user!.id;
      const { data, error } = await supabase.from("old_prescriptions").select("*").eq("user_id", uid).eq("kind", kind).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [file, setFile] = useState<File | null>(null);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const upload = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const ext = file!.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file!, { contentType: file!.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("old_prescriptions").insert({ kind, file_path: path, file_name: file!.name, doctor_name: doctor.trim() || null, rx_date: date || null, note: note.trim() || null });
      if (error) { await supabase.storage.from(BUCKET).remove([path]); throw error; }
    },
    onSuccess: () => { setFile(null); setDoctor(""); setDate(""); setNote(""); setErr(""); (document.getElementById(`rxfile-${kind}`) as HTMLInputElement | null)?.value && ((document.getElementById(`rxfile-${kind}`) as HTMLInputElement).value = ""); qc.invalidateQueries({ queryKey: ["old-rx"] }); },
    onError: (e: Error) => setErr(`${e.message} — ${t("আপলোড হয়নি। আবার চেষ্টা করুন।", "Upload failed. Please try again.")}`),
  });
  const remove = useMutation({
    mutationFn: async (r: { id: string; file_path: string }) => {
      await supabase.storage.from(BUCKET).remove([r.file_path]);
      const { error } = await supabase.from("old_prescriptions").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["old-rx"] }),
  });
  async function open(path: string) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setErr(t("আগে একটা ছবি বা PDF বেছে নিন।", "Choose a photo or PDF first."));
    if (!isAllowedDocumentFile(file)) return setErr(t("শুধু JPG, JPEG, PNG বা PDF ফাইল দেওয়া যাবে।", "Only JPG, JPEG, PNG or PDF files are allowed."));
    if (file.size > MAX_BYTES) return setErr(t("ফাইলটা ১০ MB-এর চেয়ে বড়। ছোট ছবি দিন।", "File is over 10 MB. Use a smaller one."));
    upload.mutate();
  }
  const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5";

  return (
    <section>
      {!readOnly && (
        <form onSubmit={submit} className="rounded-[10px] border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">{rep ? t("টেস্ট রিপোর্ট যোগ করুন", "Add a test report") : t("পুরনো প্রেসক্রিপশন যোগ করুন", "Add an old prescription")}</h2>
          <p className="mt-1 text-muted-foreground">{rep ? t("HbA1c, লিপিড প্রোফাইল, ক্রিয়েটিনিন বা অন্য রিপোর্টের ছবি বা PDF দিন। ডাক্তার পরামর্শ দেওয়ার সময় দেখবেন।", "Upload a photo or PDF of HbA1c, lipid profile, creatinine or other reports. Your doctor will see them when advising you.") : t("আগের ডাক্তারের প্রেসক্রিপশনের ছবি তুলে দিন। নতুন ডাক্তার এটা দেখে বুঝবেন আগে কী ওষুধ চলেছে।", "Take a photo of a previous prescription. Your new doctor will see what you were given before.")}</p>
          <label htmlFor={`rxfile-${kind}`} className="mt-4 block font-medium">{t("ছবি বা PDF (১০ MB পর্যন্ত)", "Photo or PDF (up to 10 MB)")}</label>
          <input id={`rxfile-${kind}`} type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label htmlFor={`rxd-${kind}`} className="font-medium">{rep ? t("টেস্টের নাম", "Test name") : t("ডাক্তারের নাম", "Doctor's name")}</label><input id={`rxd-${kind}`} className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)} maxLength={120} placeholder={rep ? t("যেমন: HbA1c", "e.g. HbA1c") : t("যেমন: ডা. করিম", "e.g. Dr. Karim")} /></div>
            <div><label htmlFor={`rxdt-${kind}`} className="font-medium">{rep ? t("টেস্টের তারিখ", "Test date") : t("প্রেসক্রিপশনের তারিখ", "Prescription date")}</label><input id={`rxdt-${kind}`} type="date" className={field} value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="mt-4"><label htmlFor={`rxn-${kind}`} className="font-medium">{t("নোট (ইচ্ছা হলে)", "Note (optional)")}</label><input id={`rxn-${kind}`} className={field} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></div>
          {err && <p className="mt-3 text-destructive">{err}</p>}
          <button disabled={upload.isPending} className="mt-4 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50">
            {upload.isPending ? t("আপলোড হচ্ছে…", "Uploading…") : (rep ? t("রিপোর্ট আপলোড করুন", "Upload report") : t("প্রেসক্রিপশন আপলোড করুন", "Upload prescription"))}
          </button>
        </form>
      )}
      <div className={`${readOnly ? "" : "mt-6"} rounded-[10px] border border-border bg-card`}>
        {isLoading && <p className="px-5 py-4 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>}
        {!isLoading && data.length === 0 && <p className="px-5 py-4 text-muted-foreground">{rep ? t("কোনো টেস্ট রিপোর্ট দেওয়া হয়নি।", "No test reports uploaded.") : t("কোনো পুরনো প্রেসক্রিপশন দেওয়া হয়নি।", "No old prescriptions uploaded.")}</p>}
        {data.map((r, i) => (
          <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${i ? "border-t border-border" : ""}`}>
            <div className="min-w-0">
              <p className="font-medium">{r.doctor_name || r.file_name}</p>
              <p className="text-sm text-muted-foreground">
                {r.rx_date ? formatDhaka(new Date(r.rx_date), lang, { day: "numeric", month: "long", year: "numeric" }) : t("তারিখ দেওয়া নেই", "No date")}
                {r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <button onClick={() => open(r.file_path)} className="text-primary underline underline-offset-4">{t("দেখুন", "View")}</button>
              {!readOnly && <button onClick={() => confirm((rep ? t("এই রিপোর্টটা মুছে ফেলবেন?", "Delete this report?") : t("এই প্রেসক্রিপশনটা মুছে ফেলবেন?", "Delete this prescription?"))) && remove.mutate(r)} className="text-accent underline underline-offset-4">{t("মুছুন", "Delete")}</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
