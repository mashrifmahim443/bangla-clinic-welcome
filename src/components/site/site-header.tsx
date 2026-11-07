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
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-8 sm:px-6 sm:py-4">
        <Link to="/" className="min-w-0 shrink truncate font-display text-lg font-semibold text-primary sm:text-xl">
          <span className="font-bn">ডায়াবিকেয়ার</span>
          <span className="hidden sm:inline"><span className="mx-1.5 text-muted-foreground">/</span>DiabeCare</span>
        </Link>
        <nav className="hidden flex-1 gap-6 text-[0.95rem] lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-foreground/80 hover:text-primary">
              {l.name}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
          <TextSizeToggle className="hidden sm:inline-block rounded-md border border-border px-2.5 py-1 text-sm text-foreground hover:bg-secondary" />
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="rounded-md border border-border px-2.5 py-1 text-sm text-foreground hover:bg-secondary"
            aria-label="Switch language"
          >
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
          <Link to="/auth" className="hidden rounded-md bg-primary px-4 py-2 text-sm sm:inline-block font-medium text-primary-foreground hover:bg-primary/90">
            {c("header.cta")}
          </Link>
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-md border border-border px-2.5 py-1 text-sm text-foreground hover:bg-secondary">
              {t("মেনু", "Menu")}
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-60 rounded-md border border-border bg-card p-2">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="block rounded-md px-3 py-2.5 text-foreground hover:bg-secondary">
                  {l.name}
                </a>
              ))}
              <TextSizeToggle className="mt-1 block w-full rounded-md px-3 py-2.5 text-left text-foreground hover:bg-secondary" />
              <Link to="/auth" className="mt-1 block rounded-md bg-primary px-3 py-2.5 text-center font-medium text-primary-foreground">
                {c("header.cta")}
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
