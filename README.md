# AI Document Assistant (MERN + RAG)

A general-purpose PDF question-answering app. Upload text-based PDFs such as resumes, biodata, study notes, reports, manuals, and policies. The backend extracts text, splits it into chunks, creates embeddings, stores them in MongoDB, and retrieves relevant chunks when a user asks a question. Google Gemini creates embeddings and writes answers grounded in retrieved document content.

> This is a learning-ready starter project, not a production security audit. Do not upload sensitive documents to an AI provider unless you understand its data policies. Scanned/image-only PDFs need OCR, which is not included in this starter.

## Requirements
- Node.js 18+ (Node 20+ recommended)
- MongoDB local instance or MongoDB Atlas database
- Google Gemini API key from Google AI Studio

## 1. Configure environment variables
Copy `server/.env.example` to `server/.env` and set:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: long random secret (at least 32 characters recommended)
- `GEMINI_API_KEY`: your Gemini API key; keep it on the server only

Optional: configure `GEMINI_CHAT_MODEL` and `GEMINI_EMBEDDING_MODEL` in `server/.env`.

## 2. Install dependencies
From the project root:

```bash
npm install
npm run install:all
```

Or install separately with `npm install` inside `server` and `client`.

## 3. Run the application
In the project root:

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend health check: http://localhost:5000/api/health

## 4. Use it
1. Register an account and log in.
2. Upload a text-based PDF (maximum default size: 15 MB).
3. Wait until processing completes.
4. Select the document and ask questions about its contents.
5. Answers include retrieved source excerpts. Page-level references are not available in this starter version because extracted chunks do not retain page mappings. The model is instructed to say when the document does not provide enough information.

## Architecture
- **React + Vite**: upload, document library, chat UI.
- **Express + Node.js**: auth, PDF parsing, RAG, API endpoints.
- **MongoDB + Mongoose**: users, document metadata, chunks/embeddings, chat messages.
- **Google Gemini API**: embeddings (`gemini-embedding-001`) and grounded answer generation (`gemini-3.8-flash` by default).
- **RAG**: question embedding → cosine similarity search restricted to the selected user's document → context + question sent to the LLM.

## API endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/documents/upload` (multipart field: `file`)
- `GET /api/documents`
- `GET /api/documents/:id`
- `DELETE /api/documents/:id`
- `POST /api/chat/ask` (JSON: `{ "documentId": "...", "question": "...", "conversationId": "optional" }`)
- `GET /api/chat/:conversationId`
- `GET /api/health`

## Important limitations and next improvements
- Current retrieval calculates cosine similarity in Node.js over chunks belonging to the selected document. This is simple and easy to understand for a portfolio project, but is not optimized for very large collections. For scale, use MongoDB Atlas Vector Search.
- PDF extraction works best with selectable text. Add OCR (e.g. Tesseract or a document OCR service) for scanned PDFs.
- The app accepts PDF files only in this version. DOCX/TXT can be added with separate parsers.
- AI answers can still be wrong. Always verify important information against the source PDF.
- Add rate limiting, virus scanning, stronger operational logging, HTTPS, backups, and a privacy review before public deployment.
