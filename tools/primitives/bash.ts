import { exec } from "child_process";
import { promisify } from "util";
import { ToolImplementation } from "../types";

const execAsync = promisify(exec);

export async function runBash(command: string): Promise<string> {
  try {
    console.log(`⚙️  Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    const output = stdout || stderr;
    console.log(`✓ Command completed (${output.length} bytes)`);
    return output;
  } catch (error) {
    return `Error executing command: ${(error as Error).message}`;
  }
}

export const bashTool: ToolImplementation = {
  definition: {
    name: "bash",
    description:
      "Execute a bash command and return its output. Use this to run shell commands.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute",
        },
      },
      required: ["command"],
    },
  },
  execute: async (input: { command: string }) => runBash(input.command),
};
