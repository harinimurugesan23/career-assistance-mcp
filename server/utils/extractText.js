// utils/extractText.js
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(filePath, mimetype) {
  const buffer = fs.readFileSync(filePath);

  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}
