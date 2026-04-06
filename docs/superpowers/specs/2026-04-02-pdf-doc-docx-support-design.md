# Design: PDF, DOC, DOCX File Support

**Date:** 2026-04-02
**Status:** Approved

## Context

The application accepts `.md` and `.txt` files as job requirements input. Users may have requirements documents in PDF, Word (`.docx`), or legacy Word (`.doc`) format. Supporting these formats removes the friction of converting documents before uploading.

The extracted text is injected directly into an LLM system prompt, so **plain text quality** (not formatting fidelity) is the success criterion.

## Architecture

### New: `POST /api/parse-file`

A multipart/form-data endpoint that accepts a single `file` field and returns extracted plain text.

- **PDF** → parsed with `pdf-parse` (Node.js buffer-based)
- **DOCX** → parsed with `mammoth` (text extraction mode)
- **DOC** → parsed with `mammoth` (best-effort; complex legacy docs may be incomplete)
- **Response:** `{ text: string }` on success
- **File size limit:** 10MB enforced server-side

### Modified: `FileDropZone.tsx`

- `accept` attribute updated to `.md,.txt,.pdf,.doc,.docx`
- Branching logic on file type:
  - `.md` / `.txt` → existing `FileReader.readAsText()` path (no change)
  - `.pdf` / `.doc` / `.docx` → POST to `/api/parse-file`, await `{ text }`
- New loading state (spinner + disabled drop zone) while server parses
- Error state handles three cases (see Error Handling below)

## Data Flow

```
User drops file
  → FileDropZone detects extension
  → .md/.txt: FileReader.readAsText() → onFile(text)
  → .pdf/.doc/.docx: POST /api/parse-file (FormData)
      → server: pdf-parse or mammoth → plain text
      → response: { text }
      → onFile(text)
  → SetupForm receives text string (unchanged downstream)
```

No changes to `SetupForm`, `session.ts`, `prompts.ts`, `chains.ts`, or any API beyond the new route.

## Error Handling

Three user-visible error cases in `FileDropZone`:

| Condition | Message |
|-----------|---------|
| File > 10MB | "File is too large (max 10MB)" |
| Parse failure (corrupted / unsupported variant) | "Could not extract text from this file" |
| Network/fetch error | "Upload failed, please try again" |

## Libraries

| Package | Purpose |
|---------|---------|
| `pdf-parse` | PDF → plain text (server-side) |
| `mammoth` | DOCX/DOC → plain text (server-side) |

Both are Node.js-only; no client bundle impact.

## Verification

1. Upload a `.pdf` file → extracted text appears in the requirements textarea
2. Upload a `.docx` file → extracted text appears
3. Upload a `.doc` file → text appears (may be partial for complex docs)
4. Upload a file > 10MB → "File is too large" error shown
5. Upload a corrupted PDF → "Could not extract text" error shown
6. `.md` and `.txt` uploads continue to work as before
7. After uploading any format, the interview flow completes successfully (text reaches the LLM)
