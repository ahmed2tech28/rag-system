import { readFile } from "node:fs/promises";
import mammoth from "mammoth";

import type { DocumentParser, ParsedDocument } from "./parser.interface.js";

export class DocxParser implements DocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const buffer = await readFile(filePath);

    const result = await mammoth.extractRawText({
      buffer,
    });

    return {
      text: result.value.trim(),
      metadata: {
        type: "docx",
        warnings: result.messages,
      },
    };
  }
}
