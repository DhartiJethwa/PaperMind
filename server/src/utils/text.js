function chunkText(text, maxChars = 1200, overlap = 180) {
  const normalized = text.replace(/\r/g, '').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);
    if (end < normalized.length) {
      const breakAt = Math.max(normalized.lastIndexOf('\n', end), normalized.lastIndexOf('. ', end), normalized.lastIndexOf(' ', end));
      if (breakAt > start + maxChars * 0.55) end = breakAt + 1;
    }
    const part = normalized.slice(start, end).trim();
    if (part) chunks.push(part);
    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}
function cosineSimilarity(a, b) {
  if (!a?.length || a.length !== b?.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}
module.exports = { chunkText, cosineSimilarity };
