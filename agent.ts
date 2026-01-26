import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tool definitions following Geoffrey's pattern
interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// PRIMITIVE 1: Read File Tool
const readFileTool: Tool = {
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
};

// PRIMITIVE 2: List Files Tool
const listFilesTool: Tool = {
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
};

// PRIMITIVE 3: Bash Tool
const bashTool: Tool = {
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
};

// PRIMITIVE 4: Edit File Tool
const editFileTool: Tool = {
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
};

// Tool implementations
async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(`✓ Read file: ${filePath} (${content.length} bytes)`);
    return content;
  } catch (error) {
    return `Error reading file: ${(error as Error).message}`;
  }
}

async function listFiles(dirPath: string = "."): Promise<string> {
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

async function runBash(command: string): Promise<string> {
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

async function editFile(
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

// Execute tool based on name and input
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  switch (toolName) {
    case "read_file":
      return await readFile(toolInput.path);
    case "list_files":
      return await listFiles(toolInput.path || ".");
    case "bash":
      return await runBash(toolInput.command);
    case "edit_file":
      return await editFile(toolInput.path, toolInput.old_str, toolInput.new_str);
    default:
      return `Unknown tool: ${toolName}`;
  }
}

// The main agent loop - this is the heart of everything
async function agentLoop(userMessage: string) {
  console.log("\n🤖 Agent starting...\n");
  console.log(`User: ${userMessage}\n`);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  const tools = [readFileTool, listFilesTool, bashTool, editFileTool];

  // Geoffrey's insight: "300 lines of code running in a loop with LLM tokens"
  // This is that loop!
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: tools,
      messages: messages,
    });

    console.log(`\nStop reason: ${response.stop_reason}`);

    // Add assistant's response to conversation
    messages.push({
      role: "assistant",
      content: response.content,
    });

    // Check if we're done (no more tool calls)
    if (response.stop_reason === "end_turn") {
      // Extract text responses
      const textBlocks = response.content.filter(
        (block) => block.type === "text"
      );
      if (textBlocks.length > 0) {
        console.log("\n🤖 Claude:");
        textBlocks.forEach((block) => {
          if (block.type === "text") {
            console.log(block.text);
          }
        });
      }
      break;
    }

    // Process tool calls
    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.MessageParam["content"] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`\n🔧 Tool: ${block.name}`);
          console.log(`   Input: ${JSON.stringify(block.input, null, 2)}`);

          const result = await executeTool(block.name, block.input);

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });

          console.log(`   Result: ${result.substring(0, 100)}...`);
        }
      }

      // Add tool results back to the loop
      messages.push({
        role: "user",
        content: toolResults,
      });
    }
  }

  console.log("\n✅ Agent finished\n");
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: ts-node agent.ts <your message>");
    console.log('\nExample: ts-node agent.ts "List all TypeScript files"');
    process.exit(1);
  }

  const userMessage = args.join(" ");

  try {
    await agentLoop(userMessage);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
