const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const Chat = require('../models/Chat');
const { createEmbedding, answerFromContext } = require('../services/aiService');
const { cosineSimilarity } = require('../utils/text');
const router = express.Router();
router.use(auth);
router.post('/ask', async (req, res, next) => {
  try {
    const { documentId, question, conversationId } = req.body;
    const q = String(question || '').trim();
    if (!mongoose.isValidObjectId(documentId)) return res.status(400).json({ message: 'Select a valid document.' });
    if (q.length < 2 || q.length > 2000) return res.status(400).json({ message: 'Question must be between 2 and 2,000 characters.' });
    const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
    if (!document) return res.status(404).json({ message: 'Ready document not found.' });
    let chat;
    if (conversationId && mongoose.isValidObjectId(conversationId)) chat = await Chat.findOne({ _id: conversationId, userId: req.user._id, documentId });
    if (!chat) chat = new Chat({ userId: req.user._id, documentId, title: q.slice(0, 70), messages: [] });
    const priorHistory = chat.messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    console.time('Question embedding');
    const questionVector = await createEmbedding(q, 'RETRIEVAL_QUERY');
    console.timeEnd('Question embedding');
    console.time('MongoDB chunk retrieval');
    const chunks = await DocumentChunk.find({ documentId: document._id, userId: req.user._id }).select('text pageNumber chunkIndex embedding').lean();
    console.timeEnd('MongoDB chunk retrieval');
    const ranked = chunks.map(c => ({ ...c, score: cosineSimilarity(questionVector, c.embedding) })).sort((a,b) => b.score - a.score).slice(0, 3);
    const contexts = ranked.filter(c => c.score > 0.15).map(c => ({ text: c.text, pageNumber: c.pageNumber }));
    console.time('Gemini answer generation');
    const answer = await answerFromContext(q, contexts, priorHistory);
    console.timeEnd('Gemini answer generation');
    const sources = ranked.filter(c => c.score > 0.15).slice(0, 4).map(c => ({ pageNumber: c.pageNumber, excerpt: c.text.slice(0, 280) }));
    chat.messages.push({ role: 'user', content: q });
    chat.messages.push({ role: 'assistant', content: answer, sources });
    await chat.save();
    res.json({ answer, sources, conversationId: chat._id, document: { id: document._id, name: document.originalName } });
  } catch (e) { next(e); }
});
router.get('/:conversationId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.conversationId)) return res.status(400).json({ message: 'Invalid conversation ID.' });
    const chat = await Chat.findOne({ _id: req.params.conversationId, userId: req.user._id }).lean();
    if (!chat) return res.status(404).json({ message: 'Conversation not found.' });
    res.json({ chat });
  } catch (e) { next(e); }
});
module.exports = router;
