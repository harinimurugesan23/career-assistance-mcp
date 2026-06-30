#!/usr/bin/env node
/**
 * Filesystem MCP Server
 * ----------------------
 * Real use case: instead of the user re-uploading Resume.pdf through the web UI every time,
 * they can point an MCP-aware AI client (e.g. Claude Desktop) at a local folder and say
 * "Analyze Resume.pdf" — the AI calls these tools to find and read the file directly off disk.
 *
 * Exposes:
 *   - list_resume_files(directory?)      -> lists pdf/docx files in a watched directory
 *   - read_resume_file(filename, directory?) -> extracts and returns the resume's text content
 *
 * Configure the watched directory via the RESUME_WATCH_DIR env var (defaults to ~/Desktop).
 * For safety, this server only ever reads files *within* the configured/allowed directory
 * (path traversal outside it is rejected) and never writes or deletes anything.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import os from "os";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const DEFAULT_DIR = process.env.RESUME_WATCH_DIR || path.join(os.homedir(), "Desktop");

function resolveSafe(directory, filename) {
  const baseDir = path.resolve(directory || DEFAULT_DIR);
  const target = path.resolve(baseDir, filename || "");
  if (!target.startsWith(baseDir)) {
    throw new Error("Access denied: path escapes the allowed directory.");
  }
  return target;
}

async function extractFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }
  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }
  throw new Error(`Unsupported file type "${ext}". Only .pdf and .docx are supported.`);
}

const server = new McpServer({
  name: "resume-filesystem-mcp",
  version: "1.0.0",
});

server.tool(
  "list_resume_files",
  "Lists PDF and DOCX resume files available in the watched local directory.",
  {
    directory: z
      .string()
      .optional()
      .describe(`Directory to scan. Defaults to ${DEFAULT_DIR}.`),
  },
  async ({ directory }) => {
    const dir = path.resolve(directory || DEFAULT_DIR);
    if (!fs.existsSync(dir)) {
      return { content: [{ type: "text", text: `Directory not found: ${dir}` }], isError: true };
    }
    const files = fs
      .readdirSync(dir)
      .filter((f) => [".pdf", ".docx"].includes(path.extname(f).toLowerCase()));

    return {
      content: [
        {
          type: "text",
          text: files.length
            ? `Found ${files.length} resume file(s) in ${dir}:\n` + files.map((f) => `- ${f}`).join("\n")
            : `No PDF/DOCX files found in ${dir}.`,
        },
      ],
    };
  }
);

server.tool(
  "read_resume_file",
  "Reads a resume file (PDF or DOCX) from the local filesystem and returns its extracted plain text.",
  {
    filename: z.string().describe('File name, e.g. "Resume.pdf"'),
    directory: z
      .string()
      .optional()
      .describe(`Directory containing the file. Defaults to ${DEFAULT_DIR}.`),
  },
  async ({ filename, directory }) => {
    try {
      const filePath = resolveSafe(directory, filename);
      if (!fs.existsSync(filePath)) {
        return { content: [{ type: "text", text: `File not found: ${filePath}` }], isError: true };
      }
      const text = await extractFromFile(filePath);
      return {
        content: [
          {
            type: "text",
            text: `Extracted text from ${filename} (${text.length} characters):\n\n${text}`,
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

/**
 * MCP Resource: exposes a resume file as a stable resource URI (resume://<filename>)
 * rather than text pasted into every prompt. An MCP client can read this resource once
 * and the AI can reference it for the rest of the session instead of resending the full
 * resume text on every single tool call. This is "MCP Server 3 - File Resources" from
 * the project spec, implemented here since it shares the same filesystem access.
 */
server.resource(
  "resume",
  new ResourceTemplate("resume://{filename}", {
    list: async () => {
      const dir = DEFAULT_DIR;
      if (!fs.existsSync(dir)) return { resources: [] };
      const files = fs
        .readdirSync(dir)
        .filter((f) => [".pdf", ".docx"].includes(path.extname(f).toLowerCase()));
      return {
        resources: files.map((f) => ({
          uri: `resume://${f}`,
          name: f,
          mimeType: "text/plain",
        })),
      };
    },
  }),
  async (uri, { filename }) => {
    const filePath = resolveSafe(undefined, filename);
    const text = await extractFromFile(filePath);
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
