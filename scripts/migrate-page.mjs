import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const sourcePath = path.resolve(projectRoot, "..", "xt-tactics-blog", "index.html");
const outputPath = path.join(projectRoot, "app", "page.tsx");

const source = await readFile(sourcePath, "utf8");
const bodyMatch = source.match(/<body>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error(`Could not find the body element in ${sourcePath}`);
}

let jsx = bodyMatch[1].trim();

jsx = jsx
  .replaceAll('class="', 'className="')
  .replaceAll('href="assets/', 'href="/assets/')
  .replaceAll('src="assets/', 'src="/assets/')
  .replaceAll("<br>", "<br />")
  .replaceAll("<br className=", "<br className=")
  .replaceAll(' fetchpriority="high"', " priority")
  .replaceAll("colspan=", "colSpan=")
  .replaceAll("rowspan=", "rowSpan=");

jsx = jsx.replace(/<br([^/>]*)>/g, "<br$1 />");
jsx = jsx.replace(/<img\b([^>]*)>/g, (_match, attributes) => {
  const clean = attributes.replace(/\s+loading="lazy"/g, "");
  const isSvg = /src="[^"]+\.svg"/.test(clean);
  return `<Image${clean}${isSvg ? " unoptimized" : ""} />`;
});

const page = `import Image from "next/image";

export default function HomePage() {
  return (
    <>
${jsx
  .split("\n")
  .map((line) => `      ${line}`)
  .join("\n")}
    </>
  );
}
`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, page, "utf8");
console.log(`Migrated ${sourcePath} to ${outputPath}`);
