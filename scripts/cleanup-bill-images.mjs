import { createClient } from "@libsql/client";

function parseArgs(argv) {
  const options = {
    dbUrl: process.env.BILL_CLEANUP_DB_URL || "file:.data/db/sqlite.db",
    authToken: process.env.BILL_CLEANUP_DB_AUTH_TOKEN || "",
    apply: false,
    quality: 82,
    maxSide: 1600,
    forceJpegWithoutSharp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--db") {
      options.dbUrl = argv[i + 1] || options.dbUrl;
      i += 1;
      continue;
    }

    if (arg === "--quality") {
      const value = Number(argv[i + 1]);
      if (Number.isFinite(value) && value >= 40 && value <= 100) {
        options.quality = Math.round(value);
      }
      i += 1;
      continue;
    }

    if (arg === "--auth-token") {
      options.authToken = argv[i + 1] || options.authToken;
      i += 1;
      continue;
    }

    if (arg === "--max-side") {
      const value = Number(argv[i + 1]);
      if (Number.isFinite(value) && value >= 320 && value <= 4096) {
        options.maxSide = Math.round(value);
      }
      i += 1;
      continue;
    }

    if (arg === "--force-jpeg-without-sharp") {
      options.forceJpegWithoutSharp = true;
    }
  }

  return options;
}

function extractFirstImageData(imageData) {
  if (!imageData || typeof imageData !== "string") {
    return null;
  }

  const trimmed = imageData.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("[")) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const first = parsed.find((entry) => typeof entry === "string" && entry.trim().length > 0);
      return typeof first === "string" ? first.trim() : null;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function parseDataUrl(value) {
  const match = /^data:(image\/[A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(value);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1].toLowerCase(),
    base64: match[2],
  };
}

async function maybeCompressDataUrl(dataUrl, sharpModule, { quality, maxSide, forceJpegWithoutSharp }) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return { nextDataUrl: dataUrl, compressed: false, skippedReason: "not-data-url" };
  }

  if (!sharpModule) {
    if (forceJpegWithoutSharp) {
      throw new Error("Compression requested, but sharp is not installed");
    }
    return { nextDataUrl: dataUrl, compressed: false, skippedReason: "no-sharp" };
  }

  const inputBuffer = Buffer.from(parsed.base64, "base64");
  const outputBuffer = await sharpModule.default(inputBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  const nextDataUrl = `data:image/jpeg;base64,${outputBuffer.toString("base64")}`;
  if (nextDataUrl === dataUrl) {
    return { nextDataUrl, compressed: false, skippedReason: "same-output" };
  }

  return { nextDataUrl, compressed: true, skippedReason: null };
}

async function loadSharpModule() {
  try {
    return await import("sharp");
  } catch {
    return null;
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const sharpModule = await loadSharpModule();

  if (!sharpModule) {
    console.warn("[cleanup] sharp not found. Script will still keep only the first image but cannot recompress.");
    console.warn("[cleanup] Install sharp for compression: npm install --save-dev sharp");
  }

  const client = createClient({
    url: options.dbUrl,
    authToken: options.authToken || undefined,
  });

  const rowsResult = await client.execute({
    sql: "SELECT id, imageData FROM bills WHERE imageData IS NOT NULL AND TRIM(imageData) <> ''",
  });

  const stats = {
    scanned: 0,
    changed: 0,
    compressed: 0,
    arrayTrimmed: 0,
    unchanged: 0,
    skippedNoImage: 0,
    failures: 0,
  };

  console.log(`[cleanup] mode=${options.apply ? "APPLY" : "DRY-RUN"} db=${options.dbUrl}`);
  console.log(`[cleanup] rows with imageData=${rowsResult.rows.length}`);

  for (const row of rowsResult.rows) {
    stats.scanned += 1;

    const id = String(row.id);
    const current = typeof row.imageData === "string" ? row.imageData : "";

    const firstImage = extractFirstImageData(current);
    if (!firstImage) {
      stats.skippedNoImage += 1;
      continue;
    }

    const hadArray = current.trim().startsWith("[");

    try {
      const { nextDataUrl, compressed } = await maybeCompressDataUrl(firstImage, sharpModule, options);
      const changed = nextDataUrl !== current;

      if (!changed) {
        stats.unchanged += 1;
        continue;
      }

      if (hadArray) {
        stats.arrayTrimmed += 1;
      }
      if (compressed) {
        stats.compressed += 1;
      }
      stats.changed += 1;

      if (options.apply) {
        await client.execute({
          sql: "UPDATE bills SET imageData = ? WHERE id = ?",
          args: [nextDataUrl, id],
        });
      }
    } catch (error) {
      stats.failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[cleanup] failed bill ${id}: ${message}`);
    }
  }

  console.log("[cleanup] summary", stats);

  if (!options.apply) {
    console.log("[cleanup] dry-run complete. Re-run with --apply to persist changes.");
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error("[cleanup] fatal", message);
  process.exitCode = 1;
});
