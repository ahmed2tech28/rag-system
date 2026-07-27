import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

import type { DocumentParser, ParsedDocument } from "./parser.interface.js";

export class PdfParser implements DocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const buffer = await readFile(filePath);

    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();

      return {
        text: result.text.trim(),
        metadata: {
          type: "pdf",
          pages: result.total,
        },
      };
    } finally {
      await parser.destroy();
    }
  }
}
