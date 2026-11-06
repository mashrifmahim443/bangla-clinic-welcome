import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

const KEY = "diabecare-big-text";

export function TextSizeToggle({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const [big, setBig] = useState(false);
  useEffect(() => { setBig(localStorage.getItem(KEY) === "1"); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("big-text", big);
  }, [big]);
  return (
    <button
      onClick={() => { const v = !big; setBig(v); localStorage.setItem(KEY, v ? "1" : "0"); }}
      aria-pressed={big}
      className={className}
      title={t("লেখা বড় বা ছোট করুন", "Make text larger or smaller")}
    >
      {big ? t("ছোট লেখা", "Smaller text") : t("বড় লেখা", "Larger text")}
    </button>
  );
}
