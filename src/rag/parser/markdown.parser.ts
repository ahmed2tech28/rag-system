import { readFile } from "node:fs/promises";
import TurndownService from "turndown";

import type { DocumentParser, ParsedDocument } from "./parser.interface.js";

export class MarkdownParser implements DocumentParser {
  private readonly turndown = new TurndownService();

  async parse(filePath: string): Promise<ParsedDocument> {
    const markdown = await readFile(filePath, "utf-8");

    // Wrap markdown in <pre> so Turndown treats it as plain text.
    const text = this.turndown.turndown(`<pre>${markdown}</pre>`);

    return {
      text: text.trim(),
      metadata: {
        type: "markdown",
      },
    };
  }
}
