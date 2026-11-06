import { TextSizeToggle } from "@/components/site/text-size-toggle";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  const { c, lines } = useCms();
  const links = lines("header.links").map(([name, href]) => ({ name: name ?? "", href: href || "/" }));
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <Link to="/" className="font-display text-xl font-semibold text-primary">
          <span className="font-bn">ডায়াবিকেয়ার</span>
          <span className="mx-1.5 text-muted-foreground">/</span>DiabeCare
        </Link>
        <nav className="hidden flex-1 gap-6 text-[0.95rem] md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-foreground/80 hover:text-primary">
              {l.name}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <TextSizeToggle className="rounded-md border border-border px-2.5 py-1 text-sm text-foreground hover:bg-secondary" />
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="rounded-md border border-border px-2.5 py-1 text-sm text-foreground hover:bg-secondary"
            aria-label="Switch language"
          >
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
          <Link to="/auth" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {c("header.cta")}
          </Link>
        </div>
      </div>
    </header>
  );
}
