import { articles as defaults, type Article } from "@/lib/articles";
import { useCms } from "@/lib/cms";

export function useArticles(): Article[] {
  const list = useCms().json<Article[]>("articles", defaults);
  return Array.isArray(list) ? list : defaults;
}
