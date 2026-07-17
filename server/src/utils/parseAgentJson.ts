/**
 * Safely parses JSON strings returned by LLMs, handling markdown wrapping and common syntax anomalies.
 */
export const parseAgentJson = (text: string): any => {
  const cleaned = text.trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {}

  // Strip markdown code blocks
  const withoutMarkdown = cleaned
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(withoutMarkdown);
  } catch {}

  // Attempt to extract JSON object or array bounds
  const firstOpenBrace = cleaned.indexOf("{");
  const firstOpenBracket = cleaned.indexOf("[");
  
  let startIdx = -1;
  let endIdx = -1;
  let isArray = false;

  if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
    startIdx = firstOpenBrace;
    endIdx = cleaned.lastIndexOf("}");
  } else if (firstOpenBracket !== -1) {
    startIdx = firstOpenBracket;
    endIdx = cleaned.lastIndexOf("]");
    isArray = true;
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = cleaned.slice(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch {}

    // Clean up common issues like trailing commas before closing brackets
    try {
      const fixed = candidate
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");
      return JSON.parse(fixed);
    } catch {}
  }

  // Fallback: If it looks like an array, try regex splitting objects
  if (isArray) {
    const list: any[] = [];
    const regex = /{[^{}]*}/g;
    let match;
    while ((match = regex.exec(cleaned)) !== null) {
      try {
        list.push(JSON.parse(match[0]));
      } catch {}
    }
    if (list.length > 0) return list;
  }

  throw new Error("Failed to parse output as JSON");
};
