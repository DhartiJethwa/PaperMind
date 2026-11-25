const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [{ pageNumber: Number, excerpt: String }],
  createdAt: { type: Date, default: Date.now }
}, { _id: true });
const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  title: { type: String, default: 'New conversation' },
  messages: [messageSchema]
}, { timestamps: true });
module.exports = mongoose.model('Chat', chatSchema);
