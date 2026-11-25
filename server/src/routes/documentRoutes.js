const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const auth = require('../middleware/auth');
const { processPdf } = require('../services/documentService');
const router = express.Router();
const maxBytes = (Number(process.env.MAX_PDF_MB) || 15) * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1 }, fileFilter: (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
  cb(isPdf ? null : Object.assign(new Error('Only PDF files are supported.'), { status: 400 }), isPdf);
} });
router.use(auth);
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF file to upload.' });
    const document = await processPdf({ file: req.file, userId: req.user._id });
    res.status(201).json({ document, message: 'PDF processed and ready for questions.' });
  } catch (e) { next(e); }
});
router.get('/', async (req, res, next) => {
  try { const documents = await Document.find({ userId: req.user._id }).select('-errorMessage').sort({ createdAt: -1 }).lean(); res.json({ documents }); }
  catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try { const document = await Document.findOne({ _id: req.params.id, userId: req.user._id }).select('-errorMessage'); if (!document) return res.status(404).json({ message: 'Document not found.' }); res.json({ document }); }
  catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!document) return res.status(404).json({ message: 'Document not found.' });
    await DocumentChunk.deleteMany({ documentId: document._id, userId: req.user._id });
    const Chat = require('../models/Chat'); await Chat.deleteMany({ documentId: document._id, userId: req.user._id });
    res.json({ message: 'Document and its stored chunks were deleted.' });
  } catch (e) { next(e); }
});
module.exports = router;
