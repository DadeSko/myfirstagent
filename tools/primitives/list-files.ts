import * as fs from "fs/promises";
import { ToolImplementation } from "../types";

export async function listFiles(dirPath: string = "."): Promise<string> {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const fileList = files.map((file) => {
      const prefix = file.isDirectory() ? "📁" : "📄";
      return `${prefix} ${file.name}`;
    });
    console.log(`✓ Listed ${files.length} items in ${dirPath}`);
    return fileList.join("\n");
  } catch (error) {
    return `Error listing files: ${(error as Error).message}`;
  }
}

export const listFilesTool: ToolImplementation = {
  definition: {
    name: "list_files",
    description:
      "List files and directories at a given path. If no path is provided, lists files in the current directory.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The directory path to list (defaults to current directory)",
        },
      },
    },
  },
  execute: async (input: { path?: string }) => listFiles(input.path || "."),
};
