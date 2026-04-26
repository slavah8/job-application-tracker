const PREVIEW_MAX_LENGTH = 500;

const TECHNICAL_HEADER_MARKERS = [
  "received:",
  "return-path:",
  "authentication-results:",
  "dkim-signature:",
  "spf",
  "smtp.mailfrom",
  "content-type:",
  "content-transfer-encoding:",
  "mime-version:",
  "message-id:",
  "x-yahoo",
  "x-originating",
  "arc-authentication-results:",
  "arc-message-signature:",
  "arc-seal:",
];

const CSS_JUNK_MARKERS = [
  "-webkit-text-size-adjust",
  "mso-table-lspace",
  "mso-table-rspace",
  "box-sizing",
  "!important",
  "font-size:",
  "line-height:",
  "cid:image",
  "text-decoration",
  "border-collapse",
  "html, body",
  "a, body",
  "table, td",
];

const TECHNICAL_HEADER_LINE_PATTERN =
  /^(received|return-path|authentication-results|dkim-signature|content-type|content-transfer-encoding|mime-version|message-id|x-[\w-]+|arc-[\w-]+):/i;

function decodeBasicHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function decodeQuotedPrintable(text: string) {
  return text
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9a-f]{2})/gi, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function stripHtml(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function stripCssJunk(text: string) {
  return text
    .replace(/cid:image[^\s"'<>)]*/gi, " ")
    .replace(
      /(?:-webkit-text-size-adjust|mso-table-lspace|mso-table-rspace|box-sizing|font-size|line-height|padding|margin|text-decoration|border-collapse)\s*:[^;{}]+;?/gi,
      " ",
    )
    .replace(/[^{]{0,140}\{[^{}]*\}/g, " ");
}

function hasTechnicalHeaderMarkers(text: string) {
  const normalized = text.toLowerCase();

  return TECHNICAL_HEADER_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

function looksLikeHeaderBlock(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return false;
  }

  const technicalHeaderLines = lines.filter((line) =>
    TECHNICAL_HEADER_LINE_PATTERN.test(line),
  );
  const colonHeaderLines = lines.filter((line) =>
    /^[A-Z][A-Za-z0-9-]{1,60}:\s/.test(line),
  );

  return technicalHeaderLines.length > 0 || colonHeaderLines.length >= 3;
}

function removeLeadingHeaderBlocks(text: string) {
  const blocks = text.split(/\n\s*\n/);

  while (blocks.length > 0 && looksLikeHeaderBlock(blocks[0] ?? "")) {
    blocks.shift();
  }

  return blocks.join("\n\n");
}

function removeTechnicalHeaderLines(text: string) {
  return text
    .split("\n")
    .filter((line) => !TECHNICAL_HEADER_LINE_PATTERN.test(line.trim()))
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function isMostlyHeaderJunk(text: string) {
  if (!text) {
    return true;
  }

  const markerHits = TECHNICAL_HEADER_MARKERS.filter((marker) =>
    text.toLowerCase().includes(marker),
  ).length;

  return markerHits >= 2 || looksLikeHeaderBlock(text);
}

function isMostlyCssJunk(text: string) {
  const normalized = text.toLowerCase();
  const markerHits = CSS_JUNK_MARKERS.filter((marker) =>
    normalized.includes(marker),
  ).length;
  const cssRuleCount = (text.match(/\{[^{}]*\}/g) ?? []).length;

  return markerHits > 0 || cssRuleCount >= 2;
}

export function sanitizeEmailPreview(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) {
    return null;
  }

  const withoutHeaderBlocks = removeLeadingHeaderBlocks(
    raw.replace(/\r\n/g, "\n"),
  );
  const withoutHeaderLines = removeTechnicalHeaderLines(withoutHeaderBlocks);
  const cleaned = stripCssJunk(
    decodeBasicHtmlEntities(stripHtml(decodeQuotedPrintable(withoutHeaderLines))),
  )
    .replace(/\s+/g, " ")
    .trim();

  if (
    !cleaned ||
    isMostlyHeaderJunk(cleaned) ||
    isMostlyCssJunk(cleaned) ||
    hasTechnicalHeaderMarkers(cleaned)
  ) {
    return null;
  }

  return cleaned.slice(0, PREVIEW_MAX_LENGTH);
}
