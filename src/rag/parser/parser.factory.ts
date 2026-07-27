import path from "node:path";

import { DocxParser } from "./docx.parser.js";
import { HtmlParser } from "./html.parser.js";
import { MarkdownParser } from "./markdown.parser.js";
import { PdfParser } from "./pdf.parser.js";
import { TxtParser } from "./txt.parser.js";

import type { DocumentParser } from "./parser.interface.js";

export class ParserFactory {
  static create(filePath: string): DocumentParser {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case ".pdf":
        return new PdfParser();

      case ".txt":
        return new TxtParser();

      case ".md":
      case ".markdown":
        return new MarkdownParser();

      case ".html":
      case ".htm":
        return new HtmlParser();

      case ".docx":
        return new DocxParser();

      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }
}
