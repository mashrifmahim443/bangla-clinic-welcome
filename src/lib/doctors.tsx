import nasrin from "@/assets/doctors/nasrin-islam.jpg";
import rafiqul from "@/assets/doctors/rafiqul-hasan.jpg";
import farhana from "@/assets/doctors/farhana-chowdhury.jpg";
import mahmud from "@/assets/doctors/mahmud-karim.jpg";
import shirin from "@/assets/doctors/shirin-akter.jpg";
import anwar from "@/assets/doctors/anwar-hossain.jpg";

export const doctorPhotos: Record<string, string> = {
  "nasrin-islam": nasrin, "rafiqul-hasan": rafiqul, "farhana-chowdhury": farhana,
  "mahmud-karim": mahmud, "shirin-akter": shirin, "anwar-hossain": anwar,
};

export const specialties: Record<string, [string, string]> = {
  endocrinology: ["এন্ডোক্রাইনোলজি", "Endocrinology"],
  diabetology: ["ডায়াবেটোলজি", "Diabetology"],
  nutrition: ["পুষ্টি", "Nutrition"],
  medicine: ["মেডিসিন", "Internal medicine"],
};

export const statusInfo: Record<"online" | "busy" | "offline", { dot: string; bn: string; en: string }> = {
  online: { dot: "bg-glucose-ok", bn: "অনলাইনে", en: "Online" },
  busy: { dot: "bg-glucose-high", bn: "ব্যস্ত", en: "Busy" },
  offline: { dot: "bg-muted-foreground/40", bn: "অফলাইন", en: "Offline" },
};

export function StatusDot({ status, label }: { status: keyof typeof statusInfo; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${statusInfo[status].dot}`} aria-hidden />
      {label}
    </span>
  );
}
