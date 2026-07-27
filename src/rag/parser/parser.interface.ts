export interface ParsedDocument {
  title?: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface DocumentParser {
  parse(filePath: string): Promise<ParsedDocument>;
}
