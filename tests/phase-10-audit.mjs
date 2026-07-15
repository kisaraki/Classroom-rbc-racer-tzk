import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_CONFIG } from "../js/config.js";
import { LEVELS } from "../js/data/levels.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

async function collectFiles(directory, relativePrefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) {
      continue;
    }

    const relativePath = path.join(relativePrefix, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function hash(relativePath) {
  const contents = await readFile(path.join(root, relativePath));
  return createHash("sha256").update(contents).digest("hex");
}

async function check(name, callback) {
  try {
    const result = await callback();

    if (result === false) {
      throw new Error("check returned false");
    }

    passes.push(name);
  } catch (error) {
    failures.push({ name, message: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isDeepFrozen(value) {
  if (!value || typeof value !== "object") {
    return true;
  }

  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

const allFiles = await collectFiles(root);
const runtimeFiles = allFiles.filter(
  (file) =>
    file === "index.html" ||
    file.startsWith("js" + path.sep) ||
    file.startsWith("css" + path.sep)
);
const runtimeSource = (
  await Promise.all(runtimeFiles.map((file) => read(file)))
).join("\n");
const applicationJs = (
  await Promise.all(
    allFiles
      .filter((file) => file.startsWith("js" + path.sep) && file.endsWith(".js"))
      .map((file) => read(file))
  )
).join("\n");

await check("no external runtime assets or CDN URLs", async () => {
  const urls = runtimeSource.match(/https?:\/\/[^\s"')]+/g) ?? [];
  assert(
    urls.every((url) => url === "http://www.w3.org/2000/svg"),
    "unexpected runtime URL: " + urls.join(", ")
  );
  const mediaExtensions = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".glb", ".gltf", ".obj", ".fbx", ".mp4", ".webm",
    ".woff", ".woff2", ".ttf", ".otf"
  ]);
  const media = allFiles.filter((file) =>
    mediaExtensions.has(path.extname(file).toLowerCase())
  );
  assert(media.length === 0, "external media files found: " + media.join(", "));
});

await check("Vanilla ES Modules use only relative runtime imports", async () => {
  const imports = [...applicationJs.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((match) => match[1]);
  assert(
    imports.every((specifier) => specifier.startsWith(".")),
    "bare dependency import found"
  );
  assert(
    !/\b(React|Vue|Angular|Phaser|Unity)\b/.test(applicationJs),
    "framework identifier found in runtime"
  );
});

await check("no backend, database, or runtime package dependency", async () => {
  const packageData = JSON.parse(await read("package.json"));
  assert(!packageData.dependencies, "runtime dependencies are not allowed");
  assert(!packageData.devDependencies, "package installation must remain optional");
  assert(
    !/\b(express|koa|fastify|sqlite|mongodb|postgres|mysql)\b/i.test(
      applicationJs
    ),
    "backend or database identifier found"
  );
});

await check("runtime deadlines do not use interval timers", async () => {
  assert(
    !/\bset(?:Timeout|Interval)\s*\(/.test(applicationJs),
    "setTimeout or setInterval found in application runtime"
  );
});

await check("all tuning and Phase 10 limits are deep-frozen config", async () => {
  assert(isDeepFrozen(GAME_CONFIG), "GAME_CONFIG is not deeply frozen");
  assert(
    GAME_CONFIG.qte.opportunityCountByRegion.TISSUE === 10 &&
      GAME_CONFIG.qte.opportunityCountByRegion.LUNG === 20,
    "gas opportunity counts are not centralized"
  );
  assert(
    GAME_CONFIG.performanceAcceptance.minimumFps === 30,
    "performance acceptance values are not centralized"
  );
  const qteSource = await read(path.join("js", "systems", "QTESystem.js"));
  assert(
    !/\b(?:10|20)\b/.test(qteSource),
    "QTE implementation duplicates configured opportunity counts"
  );
  assert(
    runtimeSource.split(GAME_CONFIG.palette.rbcDeoxygenatedBody).length === 2,
    "red-purple color must be declared only once in config"
  );
});

await check("four routes share one core implementation", async () => {
  assert(LEVELS.length === 4, "exactly four routes are required");
  assert(
    LEVELS.every((level) =>
      level.gasExchange.triggerDistances.every((distance) => {
        const section = level.sections.find(
          (candidate) => candidate.id === level.gasExchange.sectionId
        );
        return distance > section.startDistance && distance < section.endDistance;
      })
    ),
    "gas event found outside its exchange section"
  );
  const forkedCore = allFiles.filter((file) =>
    /Level\d+(?:Manager|System|Player)\.js$/i.test(file)
  );
  assert(forkedCore.length === 0, "level-specific core fork found");
});

await check("Three.js r184 vendor hashes and MIT license match", async () => {
  const expected = {
    "vendor/three.module.js":
      "61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2",
    "vendor/three.core.js":
      "368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3",
    "vendor/THREE-LICENSE.txt":
      "8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc"
  };

  for (const [file, expectedHash] of Object.entries(expected)) {
    assert(await hash(file) === expectedHash, file + " SHA-256 mismatch");
  }

  const license = await read("vendor/THREE-LICENSE.txt");
  assert(/MIT License/.test(license), "Three.js MIT license is missing");
});

await check("GitHub Pages entry uses repository-relative paths", async () => {
  const index = await read("index.html");
  const references = [...index.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1]);
  assert(
    references.every(
      (reference) =>
        reference.startsWith(".") ||
        reference.startsWith("#") ||
        reference.startsWith("data:image/svg+xml,")
    ),
    "root-absolute or remote entry reference found"
  );
});

passes.forEach((name) => console.log("PASS " + name));
failures.forEach(({ name, message }) =>
  console.error("FAIL " + name + ": " + message)
);
console.log(
  "Phase 10 audit: " +
    passes.length +
    " passed, " +
    failures.length +
    " failed."
);

if (failures.length > 0) {
  process.exitCode = 1;
}
