import type { HighlighterCore } from 'shiki/core';

export type CodeLanguage = 'tsx' | 'html';

let highlighter: Promise<HighlighterCore> | null = null;

/**
 * Shiki, loaded on first use and only with what the site shows: two
 * languages, the docs' two themes, and the JavaScript regex engine (no wasm).
 */
function load() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([import('shiki/core'), import('shiki/engine/javascript')]);
    return createHighlighterCore({
      themes: [import('shiki/themes/light-plus.mjs'), import('shiki/themes/vesper.mjs')],
      langs: [import('shiki/langs/tsx.mjs'), import('shiki/langs/html.mjs')],
      engine: createJavaScriptRegexEngine(),
    });
  })();
  return highlighter;
}

/**
 * Highlighted HTML for both themes at once, as the MDX docs (`--shiki-light`,
 * `--shiki-dark`); styles/index.css shows the one matching `.dark`.
 */
export async function highlight(code: string, lang: CodeLanguage) {
  const shiki = await load();
  return shiki.codeToHtml(code, { lang, themes: { light: 'light-plus', dark: 'vesper' }, defaultColor: false });
}
