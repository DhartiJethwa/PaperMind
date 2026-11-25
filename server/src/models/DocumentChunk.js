const mongoose = require('mongoose');
const chunkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  text: { type: String, required: true },
  pageNumber: { type: Number, default: null },
  chunkIndex: { type: Number, required: true },
  embedding: { type: [Number], required: true }
}, { timestamps: true });
module.exports = mongoose.model('DocumentChunk', chunkSchema);
