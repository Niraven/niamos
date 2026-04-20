import { marked } from "marked";

marked.setOptions({ async: false, gfm: true, breaks: true });

export function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string;
}
