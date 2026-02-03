import * as fs from "fs/promises";
import { ToolImplementation } from "../types";

export async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  try {
    if (oldStr === "") {
      // Creating new file
      await fs.writeFile(filePath, newStr, "utf-8");
      console.log(`✓ Created new file: ${filePath} (${newStr.length} bytes)`);
      return `Successfully created file ${filePath}`;
    } else {
      // Editing existing file
      const content = await fs.readFile(filePath, "utf-8");
      const newContent = content.replace(oldStr, newStr);
      await fs.writeFile(filePath, newContent, "utf-8");
      console.log(`✓ Edited file: ${filePath}`);
      return `Successfully edited file ${filePath}`;
    }
  } catch (error) {
    return `Error editing file: ${(error as Error).message}`;
  }
}

export const editFileTool: ToolImplementation = {
  definition: {
    name: "edit_file",
    description:
      "Edit a file by replacing old_str with new_str. If old_str is empty, creates a new file with new_str as content.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file to edit",
        },
        old_str: {
          type: "string",
          description: "The string to replace (empty for new file)",
        },
        new_str: {
          type: "string",
          description: "The new content to insert",
        },
      },
      required: ["path", "old_str", "new_str"],
    },
  },
  execute: async (input: { path: string; old_str: string; new_str: string }) =>
    editFile(input.path, input.old_str, input.new_str),
};
