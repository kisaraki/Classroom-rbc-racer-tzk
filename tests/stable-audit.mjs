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

await check("all STABLE release limits are deep-frozen config", async () => {
  assert(isDeepFrozen(GAME_CONFIG), "GAME_CONFIG is not deeply frozen");
  assert(
    GAME_CONFIG.app.name === "Project Aorta：大動脈計畫室" &&
      GAME_CONFIG.app.subtitle === "RBC RACER" &&
      GAME_CONFIG.app.status === "STABLE" &&
      GAME_CONFIG.app.version === "1.1" &&
      GAME_CONFIG.app.releaseDate === "20260715" &&
      GAME_CONFIG.app.displayVersion === "Version：1.1（20260715）",
    "release identity is not centralized"
  );
  assert(
    GAME_CONFIG.qte.opportunityCountByRegion.TISSUE === 10 &&
      GAME_CONFIG.qte.opportunityCountByRegion.LUNG === 20,
    "gas opportunity counts are not centralized"
  );
  assert(
    GAME_CONFIG.performanceAcceptance.minimumFps === 30,
    "performance acceptance values are not centralized"
  );
  assert(
    GAME_CONFIG.deviceSupport.mobileInputMode === "MOBILE_TOUCH" &&
      GAME_CONFIG.renderer.mobileMaximumPixelRatio === 1.5 &&
      GAME_CONFIG.renderer.mobileRenderResolutionScale === 0.72 &&
      GAME_CONFIG.mobileControls.orientationLockType === "landscape" &&
      GAME_CONFIG.mobileControls.volumeIncreaseCodes.includes(
        "AudioVolumeUp"
      ) &&
      GAME_CONFIG.mobileControls.volumeDecreaseCodes.includes(
        "AudioVolumeDown"
      ) &&
      GAME_CONFIG.deviceSupport.previewHostnames.join("|") ===
        "127.0.0.1|localhost",
    "mobile compatibility values are not centralized"
  );
  assert(
    GAME_CONFIG.penalties.debuffMultiplier === 2 &&
      GAME_CONFIG.bloodRupture.malariaCollisionInterval === 5 &&
      GAME_CONFIG.bloodRupture.hoodDurationMultiplier === 3 &&
      GAME_CONFIG.bloodRupture.bloodPressureMaximum === 60 &&
      GAME_CONFIG.carbonMonoxidePoisoning.collisionTriggerCount === 10 &&
      GAME_CONFIG.qte.carbonMonoxidePoisoningThreshold === 9,
    "STABLE cumulative hazard values are not centralized"
  );
  assert(
    GAME_CONFIG.collision.playerProfile.topOffsetY === 0 &&
      GAME_CONFIG.collision.playerProfile.bottomOffsetY === -1.91 &&
      GAME_CONFIG.collision.entityLabelCategories.join("|") ===
        "BUFF|DEBUFF",
    "visible collision profiles are not centralized"
  );
  const visibleBodyRadii = {
    vitaminC: 0.77,
    vitaminB12: 0.81,
    iron: 0.8,
    carbonMonoxide: 0.75,
    malaria: 1.19,
    alcohol: 1.08
  };
  assert(
    Object.entries(visibleBodyRadii).every(
      ([typeId, radius]) =>
        GAME_CONFIG.entityTypes[typeId].collisionRadius === radius
    ),
    "buff or debuff visual-body collision radius drifted"
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

await check("STABLE identity, timeout, and player-facing HUD replace development UI", async () => {
  const index = await read("index.html");
  const stateMachine = await read(
    path.join("js", "core", "GameStateMachine.js")
  );
  const renderer = await read(
    path.join("js", "cutscenes", "CutsceneRenderer.js")
  );
  const entryGuard = await read(path.join("js", "entryGuard.js"));
  const pointerLock = await read(
    path.join("js", "input", "PointerLockController.js")
  );
  const main = await read(path.join("js", "main.js"));
  const hud = await read(path.join("js", "ui", "HUDManager.js"));
  const deviceSupport = await read(
    path.join("js", "core", "DeviceSupport.js")
  );
  const mobileControls = await read(
    path.join("js", "input", "MobileControls.js")
  );
  const input = await read(path.join("js", "input", "InputController.js"));
  const releaseFiles = allFiles.filter(
    (file) =>
      /\.(?:html|css|js|mjs|json|md|yml)$/.test(file) &&
      !file.startsWith("vendor" + path.sep)
  );
  const releaseSource = (
    await Promise.all(releaseFiles.map((file) => read(file)))
  ).join("\n");

  assert(
    [
      "Project Aorta：大動脈計畫室",
      "RBC RACER",
      "STABLE",
      "Version：1.1（20260715）"
    ].every((value) => index.includes(value)),
    "formal product identity is missing from the game entry"
  );
  assert(
    /\[data-product-status\]/.test(main) &&
      !/querySelectorAll\(["']\[data-release-status\]/.test(main),
    "release binding can overwrite the game root"
  );
  assert(
    !/Phase\s*1(?:1|2)/i.test(releaseSource),
    "deprecated numbered release stage remains in the repository"
  );
  assert(/GAME_OVER_TIMEOUT/.test(stateMachine), "timeout state is missing");
  assert(/cutscene-rbc--shriveled/.test(renderer), "shriveled RBC ending is missing");
  assert(/肝臟工廠/.test(renderer), "liver factory ending is missing");
  assert(!/system-card|fps-value|pointer-value|state-value/.test(index),
    "development diagnostics remain visible in the game entry");
  assert(/malaria-steam/.test(index), "procedural malaria steam layer is missing");
  assert(/entryGuard\.js/.test(index), "local-file entry guard is missing");
  assert(
    /LOCAL_FILE_BLOCKED/.test(entryGuard) && /start-local\.cmd/.test(entryGuard),
    "local-file startup guidance is incomplete"
  );
  assert(
    /requestTimeoutMs/.test(pointerLock) && /TimeoutError/.test(pointerLock),
    "silent Pointer Lock requests have no timeout contract"
  );
  assert(
    /showPointerLockPending/.test(hud),
    "Pointer Lock startup has no immediate player feedback"
  );
  assert(
    /supported:\s*true/.test(deviceSupport) &&
      /deviceProfile:\s*deviceSupport/.test(main) &&
      /isMobilePreviewRequested/.test(main) &&
      !/showUnsupportedMobileDevice|MOBILE_BLOCKED|不支援手機/.test(
        runtimeSource
      ),
    "mobile startup is still refused or bypasses the device profile"
  );
  assert(
    [
      "mobile-controls",
      "mobile-orientation-guard",
      "data-mobile-hold-code",
      "data-mobile-qte-code"
    ].every((value) => index.includes(value)) &&
      /requestLandscapeLock/.test(mobileControls) &&
      /isLandscapeViewport/.test(mobileControls) &&
      /VOLUME_CODE_TO_CONTROL/.test(input),
    "landscape, touch, QTE, or volume-key mobile controls are incomplete"
  );
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
  "STABLE audit: " +
    passes.length +
    " passed, " +
    failures.length +
    " failed."
);

if (failures.length > 0) {
  process.exitCode = 1;
}
