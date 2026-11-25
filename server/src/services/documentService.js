const pdf = require('pdf-parse');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { chunkText } = require('../utils/text');
const { createEmbedding } = require('./aiService');

async function processPdf({ file, userId }) {
  const doc = await Document.create({ userId, originalName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size, status: 'processing' });
  try {
    const parsed = await pdf(file.buffer);
    const fullText = (parsed.text || '').trim();
    if (fullText.length < 20) {
      const e = new Error('This PDF contains little or no selectable text. Scanned PDFs need OCR; this version does not include OCR.'); e.status = 422; throw e;
    }
    const pieces = chunkText(fullText);
    if (!pieces.length) { const e = new Error('No readable text was found in this PDF.'); e.status = 422; throw e; }
    const chunkDocs = [];
    // Embed sequentially to avoid unexpectedly large parallel API requests.
    for (let i = 0; i < pieces.length; i++) {
      const embedding = await createEmbedding(pieces[i]);
      chunkDocs.push({ userId, documentId: doc._id, text: pieces[i], pageNumber: null, chunkIndex: i, embedding });
    }
    await DocumentChunk.insertMany(chunkDocs);
    doc.pageCount = parsed.numpages || 0;
    doc.chunkCount = pieces.length;
    doc.status = 'ready';
    await doc.save();
    return doc;
  } catch (error) {
    doc.status = 'failed';
    doc.errorMessage = error.message || 'PDF processing failed';
    await doc.save();
    throw error;
  }
}
module.exports = { processPdf };
