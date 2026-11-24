#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(root, "asset", "object");
const outputRoot = path.join(sourceRoot, "optimized");
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "amaterasu-objects-"));
const cellSize = 384;
const contentSize = 350;

async function filesIn(directory) {
  return (await readdir(directory))
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

async function cutOut(source, destination) {
  if (path.basename(source).startsWith("take_")) {
    // The bamboo consists of many thin leaves; AI extraction mistakes them for
    // background. These two sources use plain white, so color-key them instead.
    await execFileAsync("magick", [source, "-alpha", "on", "-fuzz", "18%", "-transparent", "white", destination]);
  } else {
    await execFileAsync("rembg", ["i", source, destination], {
      env: { ...process.env, NUMBA_CACHE_DIR: path.join(tempRoot, "numba-cache") },
      maxBuffer: 8 * 1024 * 1024,
    });
  }
}

async function normalize(source, destination) {
  await execFileAsync("magick", [
    source, "-trim", "+repage", "-resize", `${contentSize}x${contentSize}>`,
    "-gravity", "south", "-background", "none", "-extent", `${cellSize}x${cellSize}`,
    destination,
  ]);
}

async function cutOutAndNormalize(source, destination) {
  const removed = path.join(tempRoot, `${path.basename(source, ".png")}-${Math.random().toString(36).slice(2)}.png`);
  await cutOut(source, removed);
  await normalize(removed, destination);
}

async function writeWebp(sourceFrames, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await execFileAsync("magick", [
    "-background", "none", ...sourceFrames, "+append", "-strip", "-quality", "88",
    "-define", "webp:alpha-quality=95", destination,
  ]);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  format: "webp",
  cell: { width: cellSize, height: cellSize },
  note: "Original PNG files are preserved outside the optimized directory.",
  stable: [], animate: [], depth: [],
};

try {
  const stableNames = await filesIn(path.join(sourceRoot, "stable"));
  for (const name of stableNames) {
    const normalized = path.join(tempRoot, `stable-${name}`);
    const source = path.join(sourceRoot, "stable", name);
    const destination = path.join(outputRoot, "stable", name.replace(/\.png$/i, ".webp"));
    await cutOutAndNormalize(source, normalized);
    await writeWebp([normalized], destination);
    manifest.stable.push({
      name: path.basename(name, ".png"), file: path.relative(outputRoot, destination),
      frames: 1, source: path.relative(sourceRoot, source),
    });
    process.stdout.write(`stable: ${name}\n`);
  }

  for (const type of ["animate", "depth"]) {
    const names = await filesIn(path.join(sourceRoot, type));
    const groups = new Map();
    for (const name of names) {
      const key = name.replace(/_\d+\.png$/i, "");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(name);
    }
    for (const [key, frameNames] of groups) {
      const normalizedFrames = [];
      if (type === "depth") {
        const cutoutFrames = [];
        for (const name of frameNames) {
          const cutout = path.join(tempRoot, `cutout-${type}-${name}`);
          await cutOut(path.join(sourceRoot, type, name), cutout);
          cutoutFrames.push(cutout);
        }
        const merged = path.join(tempRoot, `${type}-${key}-merged.png`);
        const normalized = path.join(tempRoot, `${type}-${key}.png`);
        await execFileAsync("magick", ["-background", "none", ...cutoutFrames, "-layers", "merge", merged]);
        await normalize(merged, normalized);
        normalizedFrames.push(normalized);
      } else {
        for (const name of frameNames) {
          const normalized = path.join(tempRoot, `${type}-${name}`);
          await cutOutAndNormalize(path.join(sourceRoot, type, name), normalized);
          normalizedFrames.push(normalized);
        }
      }
      const destination = path.join(outputRoot, type, `${key}.webp`);
      await writeWebp(normalizedFrames, destination);
      manifest[type].push({
        name: key, file: path.relative(outputRoot, destination), frames: normalizedFrames.length,
        frameWidth: cellSize, frameHeight: cellSize,
        sources: frameNames.map((name) => path.join(type, name)),
      });
      process.stdout.write(`${type}: ${key} (${normalizedFrames.length} frame${normalizedFrames.length===1?'':'s'})\n`);
    }
  }

  const allEntries = [...manifest.stable, ...manifest.animate, ...manifest.depth];
  for (const entry of allEntries) {
    entry.bytes = (await stat(path.join(outputRoot, entry.file))).size;
  }
  manifest.totalBytes = allEntries.reduce((sum, entry) => sum + entry.bytes, 0);
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Done: ${allEntries.length} optimized assets, ${manifest.totalBytes} bytes.\n`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
