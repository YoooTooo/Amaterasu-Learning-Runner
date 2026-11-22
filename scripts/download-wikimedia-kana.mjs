#!/usr/bin/env node

import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "asset", "audio", "kana");
const API = "https://commons.wikimedia.org/w/api.php";
const execFileAsync = promisify(execFile);
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options, label) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok || response.status !== 429) return response;
    const retryAfter = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1500 * (attempt + 1);
    process.stdout.write(`Rate limited while fetching ${label}; retrying in ${delay}ms.\n`);
    await sleep(delay);
  }
  throw new Error(`Commons rate limit persisted: ${label}`);
}

const rows = [
  ["あ", "a", "basic", "File:Ja-A.oga"], ["い", "i", "basic", "File:Japanese I.ogg"],
  ["う", "u", "basic", "File:Japanese U.ogg"], ["え", "e", "basic", "File:Ja-E.oga"],
  ["お", "o", "basic", "File:Japanese O.ogg"], ["か", "ka", "basic", "File:Ja-Ka.oga"],
  ["き", "ki", "basic", "File:Japanese ki.ogg"], ["く", "ku", "basic", "File:Japanese ku.ogg"],
  ["け", "ke", "basic", "File:Japanese ke.ogg"], ["こ", "ko", "basic", "File:Japanese ko.ogg"],
  ["さ", "sa", "basic", "File:Japanese sa.ogg"], ["し", "shi", "basic", "File:Japanese shi.ogg"],
  ["す", "su", "basic", "File:Japanese su.ogg"], ["せ", "se", "basic", "File:Japanese se.ogg"],
  ["そ", "so", "basic", "File:Ja-So.oga"], ["た", "ta", "basic", "File:Japanese ta.ogg"],
  ["ち", "chi", "basic", "File:Japanese ti.ogg"], ["つ", "tsu", "basic", "File:Japanese tsu.ogg"],
  ["て", "te", "basic", "File:Japanese te.ogg"], ["と", "to", "basic", "File:Japanese to.ogg"],
  ["な", "na", "basic", "File:Japanese na.ogg"], ["に", "ni", "basic", "File:Japanese ni.ogg"],
  ["ぬ", "nu", "basic", "File:Japanese nu.ogg"], ["ね", "ne", "basic", "File:Japanese ne.ogg"],
  ["の", "no", "basic", "File:Japanese no.ogg"], ["は", "ha", "basic", "File:Japanese ha.ogg"],
  ["ひ", "hi", "basic", "File:Japanese hi.ogg"], ["ふ", "fu", "basic", "File:Japanese hu.ogg"],
  ["へ", "he", "basic", "File:Japanese he.ogg"], ["ほ", "ho", "basic", "File:Japanese ho.ogg"],
  ["ま", "ma", "basic", "File:Japanese ma.ogg"], ["み", "mi", "basic", "File:Japanese mi.ogg"],
  ["む", "mu", "basic", "File:Japanese mu.ogg"], ["め", "me", "basic", "File:Japanese me.ogg"],
  ["も", "mo", "basic", "File:Japanese mo.ogg"], ["や", "ya", "basic", "File:Japanese ya.ogg"],
  ["ゆ", "yu", "basic", "File:Japanese yu.ogg"], ["よ", "yo", "basic", "File:Japanese yo.ogg"],
  ["ら", "ra", "basic", "File:Japanese ra.ogg"], ["り", "ri", "basic", "File:Japanese ri.ogg"],
  ["る", "ru", "basic", "File:Japanese ru.ogg"], ["れ", "re", "basic", "File:Japanese re.ogg"],
  ["ろ", "ro", "basic", "File:Japanese ro.ogg"], ["わ", "wa", "basic", "File:Japanese wa.ogg"],
  ["を", "wo", "basic", "File:Japanese wo.ogg"], ["ん", "n", "basic", "File:Japanese N.ogg"],
  ...[
    ["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"],
    ["ざ", "za"], ["じ", "ji", "zi"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"],
    ["だ", "da"], ["ぢ", "di"], ["づ", "du"], ["で", "de"], ["ど", "do"],
    ["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"],
  ].map(([kana, slug, source = slug]) => [kana, slug, "voiced", `File:Japanese ${source}.ogg`]),
  ...[["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"]]
    .map(([kana, slug]) => [kana, slug, "semi-voiced", `File:Japanese ${slug}.ogg`]),
  ["りゅ", "ryu", "yoon", "File:Ja-Ryu.oga"],
];

const yoon = [
  ["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"], ["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"],
  ["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"], ["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"],
  ["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"], ["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"],
  ["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"], ["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"],
  ["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"], ["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"],
  ["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"],
];

async function commonsInfo(title) {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", prop: "imageinfo",
    iiprop: "url|extmetadata", titles: title,
  });
  const response = await fetchWithRetry(`${API}?${params}`, { headers: { "User-Agent": "Amaterasu-Learning-Runner/1.0 (educational game asset downloader)" } }, title);
  if (!response.ok) throw new Error(`Commons API ${response.status}: ${title}`);
  const page = Object.values((await response.json()).query.pages)[0];
  return page.missing === undefined ? page.imageinfo[0] : null;
}

await mkdir(OUTPUT_DIR, { recursive: true });
const files = [];

for (const [kana, slug, group, title] of rows) {
  const destination = `${group}/${slug}.mp3`;
  const targetDir = path.join(OUTPUT_DIR, group);
  await mkdir(targetDir, { recursive: true });
  await sleep(250);
  const sourceFileName = title.replace(/^File:/, "").replaceAll(" ", "_");
  const hash = createHash("md5").update(sourceFileName).digest("hex");
  const encodedName = encodeURIComponent(sourceFileName);
  const downloadUrl = `https://upload.wikimedia.org/wikipedia/commons/transcoded/${hash[0]}/${hash.slice(0, 2)}/${encodedName}/${encodedName}.mp3`;
  const targetPath = path.join(OUTPUT_DIR, destination);
  const partialPath = `${targetPath}.part`;
  try {
    const existing = await stat(targetPath);
    if (existing.size < 1024) throw new Error("Incomplete file");
    process.stdout.write(`Kept ${kana} -> ${destination}\n`);
  } catch {
    await execFileAsync("curl", ["-f", "-sS", "-L", "--retry", "5", "--retry-delay", "2", "-o", partialPath, downloadUrl]);
    await rename(partialPath, targetPath);
    process.stdout.write(`Downloaded ${kana} -> ${destination}\n`);
  }
  files.push({
    kana, romanization: slug, group, file: destination,
    commonsTitle: title,
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
    license: "See Wikimedia Commons source page",
    artist: "See Wikimedia Commons source page",
  });
}

const downloadedKana = new Set(files.map(({ kana }) => kana));
const missingYoon = yoon.filter(([kana]) => !downloadedKana.has(kana)).map(([kana, romanization]) => ({ kana, romanization }));
const manifest = {
  generatedAt: new Date().toISOString(),
  source: "Wikimedia Commons",
  note: "Only isolated kana recordings are included; recordings of whole words were not substituted.",
  counts: { downloaded: files.length, missingYoon: missingYoon.length },
  files,
  missingYoon,
};
await writeFile(path.join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Done: ${files.length} files; ${missingYoon.length} yoon recordings unavailable.\n`);
