import * as fs from "fs/promises";
import { ToolImplementation } from "../types";

export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(`✓ Read file: ${filePath} (${content.length} bytes)`);
    return content;
  } catch (error) {
    return `Error reading file: ${(error as Error).message}`;
  }
}

export const readFileTool: ToolImplementation = {
  definition: {
    name: "read_file",
    description:
      "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The relative path to the file to read",
        },
      },
      required: ["path"],
    },
  },
  execute: async (input: { path: string }) => readFile(input.path),
};
