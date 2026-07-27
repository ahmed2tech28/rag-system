import { readFile } from "node:fs/promises";
import type { DocumentParser, ParsedDocument } from "./parser.interface.js";

export class TxtParser implements DocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const text = await readFile(filePath, "utf-8");
    return { text: text.trim(), metadata: { type: "txt" } };
  }
}
