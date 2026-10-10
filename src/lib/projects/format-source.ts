import {starterSchema, type Starter} from "../domain/starter";

const parsers: Record<string, string> = {html: "html", htm: "html", css: "css", scss: "scss", less: "less", js: "babel", jsx: "babel", mjs: "babel", cjs: "babel", ts: "typescript", tsx: "typescript", json: "json", md: "markdown"};

// Standalone parsers only: formatting never evaluates code or loads project config.
export async function formatSource(path: string, content: string): Promise<{content: string; preserved: boolean}> {
  const parser = parsers[path.split(".").at(-1)?.toLowerCase() ?? ""];
  if (!parser) return {content, preserved: true};
  try {
    const [prettier, html, css, babel, typescript, estree, markdown] = await Promise.all([
      import("prettier/standalone"), import("prettier/plugins/html"), import("prettier/plugins/postcss"),
      import("prettier/plugins/babel"), import("prettier/plugins/typescript"), import("prettier/plugins/estree"), import("prettier/plugins/markdown"),
    ]);
    const formatted = await prettier.format(content, {parser, plugins: [html, css, babel, typescript, estree, markdown], printWidth: 80, tabWidth: 2, useTabs: false, htmlWhitespaceSensitivity: "css", embeddedLanguageFormatting: "off"});
    return {content: formatted, preserved: false};
  } catch { return {content, preserved: true}; }
}

export async function formatStarter(starter: Starter): Promise<Starter> {
  const files = await Promise.all(starter.files.map(async file => ({...file, content: (await formatSource(file.path, file.content)).content})));
  const readable = starterSchema.safeParse({...starter, files});
  // Preserve a valid export if formatting would exceed the starter size budget.
  return readable.success ? readable.data : starter;
}
