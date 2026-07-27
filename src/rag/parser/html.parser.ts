import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";

import type { DocumentParser, ParsedDocument } from "./parser.interface.js";

export class HtmlParser implements DocumentParser {
  async parse(filePath: string): Promise<ParsedDocument> {
    const html = await readFile(filePath, "utf8");

    const $ = cheerio.load(html);

    // Remove non-content elements
    $("script").remove();
    $("style").remove();
    $("noscript").remove();

    const title = $("title").text().trim() || "Untitled Document";

    const text = $("body").text().replace(/\s+/g, " ").trim();

    return {
      title,
      text,
      metadata: {
        type: "html",
      },
    };
  }
}
