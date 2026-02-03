import { exec } from "child_process";
import { promisify } from "util";
import { ToolImplementation } from "../types";

const execAsync = promisify(exec);

export interface CodeSearchOptions {
  pattern: string;
  path?: string;
  file_type?: string;
  case_sensitive?: boolean;
  max_results?: number;
}

export interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

export function parseRipgrepOutput(output: string): SearchMatch[] {
  const matches: SearchMatch[] = [];
  const lines = output.trim().split("\n");

  for (const line of lines) {
    // Format: file:line:content
    const match = line.match(/^([^:]+):(\d+):(.+)$/);

    if (match) {
      matches.push({
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3].trim(),
      });
    }
  }

  return matches;
}

export function formatSearchResults(
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

    for (const match of fileMatches.slice(0, 5)) {
      // Max 5 per file
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

export async function codeSearch(options: CodeSearchOptions): Promise<string> {
  const {
    pattern,
    path = ".",
    file_type,
    case_sensitive = false,
    max_results = 50,
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
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
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

export const codeSearchTool: ToolImplementation = {
  definition: {
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
          description: "The search pattern (literal text or regex)",
        },
        path: {
          type: "string",
          description: "Directory to search (default: current directory)",
        },
        file_type: {
          type: "string",
          description: "File type: ts, js, py, rs, etc.",
        },
        case_sensitive: {
          type: "boolean",
          description: "Case-sensitive search (default: false)",
        },
        max_results: {
          type: "number",
          description: "Maximum results to show (default: 50)",
        },
      },
      required: ["pattern"],
    },
  },
  execute: async (input: CodeSearchOptions) => codeSearch(input),
};
