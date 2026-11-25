const mongoose = require('mongoose');
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, default: 'application/pdf' },
  sizeBytes: { type: Number, required: true },
  pageCount: { type: Number, default: 0 },
  chunkCount: { type: Number, default: 0 },
  status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
  errorMessage: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Document', documentSchema);
