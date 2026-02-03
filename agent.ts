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


// PRIMITIVE 5: Code Search Tool
const codeSearchTool: Tool = {
  name: "code_search",
  description: `Search for code patterns using ripgrep (rg).
  
This tool is extremely powerful for finding:
- Function definitions and usage
- Variable references  
- Import statements
- TODO/FIXME comments
- Code patterns for refactoring

Examples:
- "async function" - Find all async functions
- "import.*Anthropic" - Find Anthropic imports
- "TODO|FIXME" - Find all TODOs and FIXMEs
- "\\bclient\\b" - Find exact word "client"

The search respects .gitignore and is very fast.
`,
  input_schema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "The search pattern (literal text or regex)"
      },
      path: {
        type: "string",
        description: "Directory to search (default: current directory)"
      },
      file_type: {
        type: "string",
        description: "File type: ts, js, py, rs, etc."
      },
      case_sensitive: {
        type: "boolean",
        description: "Case-sensitive search (default: false)"
      },
      max_results: {
        type: "number",
        description: "Maximum results to show (default: 50)"
      }
    },
    required: ["pattern"]
  }
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

interface CodeSearchOptions {
  pattern: string;
  path?: string;
  file_type?: string;
  case_sensitive?: boolean;
  max_results?: number;
}

async function codeSearch(options: CodeSearchOptions): Promise<string> {
  const {
    pattern,
    path = ".",
    file_type,
    case_sensitive = false,
    max_results = 50
  } = options;

  try {
    // Build ripgrep command
    const args: string[] = ["rg"];
    
    // Case insensitive by default
    if (!case_sensitive) {
      args.push("-i");
    }
    
    // File type filter
    if (file_type) {
      args.push(`-t${file_type}`);
    }
    
    // Max results
    args.push(`-m ${max_results}`);
    
    // Line numbers
    args.push("-n");
    
    // No color (for parsing)
    args.push("--color=never");
    
    // Pattern and path
    args.push(`"${pattern}"`);
    args.push(path);
    
    const command = args.join(" ");
    console.log(`🔍 Searching for: ${pattern}`);
    
    const { stdout } = await execAsync(command, { 
      timeout: 10000,  // 10 second timeout
      maxBuffer: 1024 * 1024  // 1MB buffer
    });
    
    if (stdout) {
      const matches = parseRipgrepOutput(stdout);
      return formatSearchResults(pattern, matches);
    }
    
    return `No matches found for pattern: ${pattern}`;
    
  } catch (error: any) {
    // ripgrep exit code 1 = no matches (not an error!)
    if (error.code === 1) {
      return `No matches found for pattern: ${pattern}`;
    }
    
    // Timeout
    if (error.killed) {
      return `Error: Search timed out. Please refine your pattern.`;
    }
    
    // ripgrep not installed
    if (error.message.includes("command not found")) {
      return `Error: ripgrep (rg) is not installed. Install it with: brew install ripgrep`;
    }
    
    return `Error searching: ${error.message}`;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

function parseRipgrepOutput(output: string): SearchMatch[] {
  const matches: SearchMatch[] = [];
  const lines = output.trim().split("\n");
  
  for (const line of lines) {
    // Format: file:line:content
    const match = line.match(/^([^:]+):(\d+):(.+)$/);
    
    if (match) {
      matches.push({
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3].trim()
      });
    }
  }
  
  return matches;
}

function formatSearchResults(
  pattern: string, 
  matches: SearchMatch[]
): string {
  if (matches.length === 0) {
    return `No matches found for pattern: ${pattern}`;
  }
  
  // Group by file
  const byFile = new Map<string, SearchMatch[]>();
  for (const match of matches) {
    if (!byFile.has(match.file)) {
      byFile.set(match.file, []);
    }
    byFile.get(match.file)!.push(match);
  }
  
  // Format output
  let result = `Found ${matches.length} matches in ${byFile.size} files:\n\n`;
  
  for (const [file, fileMatches] of byFile) {
    result += `📄 ${file} (${fileMatches.length} matches):\n`;
    
    for (const match of fileMatches.slice(0, 5)) {  // Max 5 per file
      result += `  Line ${match.line}: ${match.content}\n`;
    }
    
    if (fileMatches.length > 5) {
      result += `  ... and ${fileMatches.length - 5} more matches\n`;
    }
    
    result += "\n";
  }
  
  console.log(`✓ Found ${matches.length} matches for: ${pattern}`);
  
  return result.trim();
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
      case "code_search":
      return await codeSearch({
        pattern: toolInput.pattern,
        path: toolInput.path,
        file_type: toolInput.file_type,
        case_sensitive: toolInput.case_sensitive,
        max_results: toolInput.max_results
      });
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

  const tools = [readFileTool, listFilesTool, bashTool, editFileTool, codeSearchTool];

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
