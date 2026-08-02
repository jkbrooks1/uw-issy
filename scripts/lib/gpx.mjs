// Small dependency-free GPX reader shared by the route validation and
// GPX-to-GeoJSON conversion scripts. Deliberately narrow: it only reads the
// elements this project's canonical GPX actually uses (metadata name, trk,
// trkseg, trkpt with optional ele) — it is not a general-purpose GPX parser.

export class GpxError extends Error {}

/**
 * Minimal stack-based well-formedness check. Throws GpxError with a specific
 * reason on the first structural problem found (mismatched or unclosed tags,
 * unbalanced angle brackets).
 */
export function assertWellFormedXml(xmlText) {
  const stripped = xmlText
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "");

  const tagPattern = /<(\/?)([a-zA-Z_][\w:.-]*)[^>]*?(\/?)>/g;
  const stack = [];
  let match;
  while ((match = tagPattern.exec(stripped)) !== null) {
    const [, closing, name, selfClosing] = match;
    if (closing) {
      const expected = stack.pop();
      if (expected !== name) {
        throw new GpxError(
          `mismatched closing tag </${name}> (expected </${expected ?? "nothing open"}>)`,
        );
      }
    } else if (!selfClosing) {
      stack.push(name);
    }
  }
  if (stack.length > 0) {
    throw new GpxError(`unclosed tag(s): <${stack.join(">, <")}>`);
  }

  const openCount = (stripped.match(/</g) ?? []).length;
  const closeCount = (stripped.match(/>/g) ?? []).length;
  if (openCount !== closeCount) {
    throw new GpxError("unbalanced angle brackets");
  }
}

function extractFirstTagText(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`));
  return match ? match[1].trim() : null;
}

function extractBlocks(source, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?</${tagName}>`, "g");
  return source.match(pattern) ?? [];
}

function extractTrkpts(segmentBlock) {
  const points = [];
  const trkptPattern = /<trkpt\b([^>]*?)\/>|<trkpt\b([^>]*?)>([\s\S]*?)<\/trkpt>/g;
  let match;
  while ((match = trkptPattern.exec(segmentBlock)) !== null) {
    const attrs = match[1] !== undefined ? match[1] : match[2];
    const body = match[3] ?? "";
    const latAttr = attrs.match(/\blat="([^"]*)"/);
    const lonAttr = attrs.match(/\blon="([^"]*)"/);
    const eleMatch = body.match(/<ele>([^<]*)<\/ele>/);
    const lat = latAttr ? Number(latAttr[1]) : NaN;
    const lon = lonAttr ? Number(lonAttr[1]) : NaN;
    const ele = eleMatch ? Number(eleMatch[1]) : null;
    points.push({ lat, lon, ele: ele !== null && Number.isFinite(ele) ? ele : null });
  }
  return points;
}

/**
 * Parses the GPX's metadata name and every track/segment/point, preserving
 * document order. Does not validate values — callers decide what "valid"
 * means for their purpose.
 */
export function parseGpxTracks(xmlText) {
  const metadataBlock = extractBlocks(xmlText, "metadata")[0] ?? null;
  const metadataName = metadataBlock ? extractFirstTagText(metadataBlock, "name") : null;

  const trkBlocks = extractBlocks(xmlText, "trk");
  const tracks = trkBlocks.map((trkBlock) => {
    const name = extractFirstTagText(trkBlock, "name");
    const trksegBlocks = extractBlocks(trkBlock, "trkseg");
    const segments = trksegBlocks.map((segBlock) => extractTrkpts(segBlock));
    return { name, segments };
  });

  return { metadataName, tracks };
}
