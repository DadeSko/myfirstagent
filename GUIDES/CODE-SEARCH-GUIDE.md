# 🔍 Code Search Tool - Deep Dive

Complete guide on implementing a code search tool using ripgrep.

---

## 🎯 What is Code Search?

The **code search tool** is the **5th primitive** of a professional coding agent according to Geoffrey Huntley.

### Why is it Important?

```
Without code_search:
  User: "Find all async functions in the project"
  Agent: "I can't search in the code" ❌

With code_search:
  User: "Find all async functions in the project"
  Agent: [searches "async function"]
         "Found 23 occurrences in 8 files!" ✅
```

**Real Use Cases:**
- 🔍 Find function definitions
- 📝 Search for variable usage
- 🐛 Locate bug patterns
- 📊 Code analysis (how many TODOs?, how many console.logs?)
- ♻️ Refactoring (find all uses of an API)

---

## 🛠️ The Technology: ripgrep (rg)

### What is ripgrep?

**ripgrep** (command: `rg`) is an ultra-fast text search tool:
- ✅ Written in Rust → super fast
- ✅ Respects .gitignore automatically
- ✅ Syntax highlighting
- ✅ Smart recursive search
- ✅ Regex support

### Geoffrey's Insight

> "What if I were to tell you that there is no magic for indexing source code or any intelligence? Nearly every coding tool currently available uses the open source ripgrep binary under the hood."

**Everyone uses ripgrep:**
- Cursor
- GitHub Copilot
- Windsurf
- Claude Code
- VS Code search

---

## 📦 Installing ripgrep

### macOS
```bash
brew install ripgrep
```

### Ubuntu/Debian
```bash
sudo apt-get install ripgrep
```

### Windows
```bash
# With Chocolatey
choco install ripgrep

# With Scoop
scoop install ripgrep

# Or download from GitHub releases
```

### Verify Installation
```bash
rg --version
# Output: ripgrep 14.1.0
```

---

## 🔧 Basic Implementation

### Tool Definition

```typescript
const codeSearchTool: Tool = {
  name: "code_search",
  description: `Search for code patterns using ripgrep (rg).

Use this to find code patterns, function definitions, variable usage, or any text in the codebase.
You can search by pattern, file type, or directory.

Examples:
- Find all async functions: "async function"
- Find TODO comments: "TODO"
- Find imports: "import.*from"
`,
  input_schema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "The search pattern (can be literal text or regex)"
      },
      path: {
        type: "string",
        description: "Directory to search in (default: current directory)"
      },
      file_type: {
        type: "string",
        description: "File extension to filter (e.g., 'ts', 'js', 'py')"
      },
      case_sensitive: {
        type: "boolean",
        description: "Whether search should be case-sensitive (default: false)"
      }
    },
    required: ["pattern"]
  }
};
```

### Basic Implementation

```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function codeSearch(
  pattern: string,
  searchPath: string = ".",
  fileType?: string,
  caseSensitive: boolean = false
): Promise<string> {
  try {
    // Build ripgrep command
    let command = "rg";

    // Case insensitive by default
    if (!caseSensitive) {
      command += " -i";
    }

    // Add file type if specified
    if (fileType) {
      command += ` -t ${fileType}`;
    }

    // Add pattern (quoted for security)
    command += ` "${pattern}"`;

    // Add path
    command += ` ${searchPath}`;

    console.log(`🔍 Searching for pattern: ${pattern}`);

    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      const lines = stdout.trim().split("\n");
      console.log(`✓ Found ${lines.length} matches`);
      return stdout;
    } else {
      return `No matches found for pattern: ${pattern}`;
    }

  } catch (error) {
    const err = error as any;

    // ripgrep exit code 1 = no matches found (not an error!)
    if (err.code === 1) {
      return `No matches found for pattern: ${pattern}`;
    }

    return `Error searching: ${err.message}`;
  }
}
```

---

## 🎨 Advanced Implementation

### With All ripgrep Options

```typescript
interface CodeSearchOptions {
  pattern: string;
  path?: string;
  fileType?: string;
  caseSensitive?: boolean;
  maxResults?: number;
  contextLines?: number;
  filesOnly?: boolean;
  invertMatch?: boolean;
}

async function codeSearch(options: CodeSearchOptions): Promise<string> {
  const {
    pattern,
    path = ".",
    fileType,
    caseSensitive = false,
    maxResults = 100,
    contextLines = 0,
    filesOnly = false,
    invertMatch = false,
  } = options;

  try {
    // Build command
    const args: string[] = ["rg"];

    // Case sensitivity
    if (!caseSensitive) {
      args.push("-i");
    }

    // File type
    if (fileType) {
      args.push(`-t${fileType}`);
    }

    // Max results
    if (maxResults) {
      args.push(`-m ${maxResults}`);
    }

    // Context lines
    if (contextLines > 0) {
      args.push(`-C ${contextLines}`);
    }

    // Files only (only file names, not content)
    if (filesOnly) {
      args.push("-l");
    }

    // Invert match
    if (invertMatch) {
      args.push("-v");
    }

    // Line numbers
    args.push("-n");

    // Color output (for terminal display)
    args.push("--color=never");

    // Pattern and path
    args.push(`"${pattern}"`);
    args.push(path);

    const command = args.join(" ");
    console.log(`🔍 Executing: ${command}`);

    const { stdout } = await execAsync(command);

    if (stdout) {
      const lines = stdout.trim().split("\n");
      console.log(`✓ Found ${lines.length} matches for: ${pattern}`);
      return stdout;
    }

    return `No matches found for pattern: ${pattern}`;

  } catch (error: any) {
    if (error.code === 1) {
      return `No matches found for pattern: ${pattern}`;
    }
    return `Error searching: ${error.message}`;
  }
}
```

---

## 📊 Essential ripgrep Flags

### Most Common Flags

```bash
# Case insensitive
rg -i "pattern"

# Only TypeScript files
rg -tts "pattern"

# Only JavaScript files
rg -tjs "pattern"

# Multiple file types
rg -tts -tjs "pattern"

# Max results
rg -m 10 "pattern"

# Context lines (before/after)
rg -C 2 "pattern"        # 2 lines before and after
rg -B 2 "pattern"        # 2 lines before
rg -A 2 "pattern"        # 2 lines after

# Only file names (no content)
rg -l "pattern"

# Count occurrences
rg -c "pattern"

# Invert match (find lines that DON'T match)
rg -v "pattern"

# Fixed string (no regex)
rg -F "literal.string"

# Word boundary
rg -w "word"

# Multiline search
rg -U "pattern.*across.*lines"
```

### File Type Shortcuts

```bash
-tts   = TypeScript (.ts, .tsx)
-tjs   = JavaScript (.js, .jsx)
-tpy   = Python (.py)
-trust = Rust (.rs)
-tgo   = Go (.go)
-tjava = Java (.java)
-tc    = C (.c, .h)
-tcpp  = C++ (.cpp, .hpp)
-thtml = HTML (.html)
-tcss  = CSS (.css)
-tjson = JSON (.json)
-tmd   = Markdown (.md)
```

### Custom File Types

```bash
# Define custom type
rg --type-add 'config:*.{yml,yaml,toml,json}' -tconfig "pattern"
```

---

## 🎯 Real-World Use Cases

### 1. Find Function Definitions

```typescript
// User: "Find where the readFile function is defined"
await codeSearch({
  pattern: "^(async )?function readFile",
  fileType: "ts"
});

// Output:
// agent.ts:85:async function readFile(filePath: string): Promise<string> {
```

### 2. Find All TODOs

```typescript
// User: "How many TODOs are in the project?"
await codeSearch({
  pattern: "TODO|FIXME|XXX",
  caseSensitive: false
});

// Output:
// agent.ts:120:// TODO: Add retry logic
// utils.ts:45:// FIXME: Handle edge case
// index.ts:12:// XXX: Temporary hack
```

### 3. Find Imports from a Package

```typescript
// User: "Find all files that import from Anthropic"
await codeSearch({
  pattern: 'import.*from.*"@anthropic-ai/sdk"',
  fileType: "ts"
});

// Output:
// agent.ts:1:import Anthropic from "@anthropic-ai/sdk";
// test.ts:3:import Anthropic from "@anthropic-ai/sdk";
```

### 4. Find Variable Usage

```typescript
// User: "Where is the 'client' variable used?"
await codeSearch({
  pattern: "\\bclient\\b",  // Word boundary
  fileType: "ts"
});

// Output:
// agent.ts:12:const client = new Anthropic({
// agent.ts:145:  const response = await client.messages.create({
```

### 5. Security Analysis

```typescript
// User: "Search for potential security issues"
await codeSearch({
  pattern: "eval\\(|innerHTML|dangerouslySetInnerHTML"
});

// Output:
// app.tsx:56:  div.innerHTML = userInput;  // ⚠️ XSS risk!
```

---

## 🔬 Parsing ripgrep Output

### Output Format

```
file_path:line_number:matched_line_content
```

Example:
```
agent.ts:85:async function readFile(filePath: string): Promise<string> {
agent.ts:120:  console.log("Reading file...");
utils.ts:12:function processFile(path: string) {
```

### Advanced Parser

```typescript
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

// Usage:
async function codeSearchParsed(pattern: string): Promise<SearchMatch[]> {
  const output = await codeSearch({ pattern });
  return parseRipgrepOutput(output);
}
```

### Formatted Output for Claude

```typescript
async function codeSearch(options: CodeSearchOptions): Promise<string> {
  try {
    const output = await executeRipgrep(options);
    const matches = parseRipgrepOutput(output);

    if (matches.length === 0) {
      return `No matches found for pattern: ${options.pattern}`;
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
      for (const match of fileMatches) {
        result += `  Line ${match.line}: ${match.content}\n`;
      }
      result += "\n";
    }

    return result;

  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

Output Example:
```
Found 5 matches in 2 files:

📄 agent.ts (3 matches):
  Line 85: async function readFile(filePath: string): Promise<string> {
  Line 120: async function writeFile(filePath: string, content: string) {
  Line 155: async function deleteFile(filePath: string) {

📄 utils.ts (2 matches):
  Line 12: function processFile(path: string) {
  Line 45: export function validateFile(path: string) {
```

---

## 🛡️ Security & Best Practices

### 1. Escape Pattern Input

```typescript
function escapeRegex(pattern: string): string {
  // Escape special regex characters
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function codeSearch(pattern: string): Promise<string> {
  // If user input is literal string, escape it
  const escapedPattern = escapeRegex(pattern);

  // Use -F for literal search (no regex)
  const command = `rg -F "${escapedPattern}"`;
  // ...
}
```

### 2. Limit Results

```typescript
async function codeSearch(pattern: string): Promise<string> {
  const MAX_RESULTS = 500;

  // Use -m flag to limit
  const command = `rg -m ${MAX_RESULTS} "${pattern}"`;

  const output = await execAsync(command);

  if (output.stdout.includes(`(${MAX_RESULTS} matches shown)`)) {
    return `Found ${MAX_RESULTS}+ matches (truncated). Please refine your search.`;
  }

  return output.stdout;
}
```

### 3. Timeout Protection

```typescript
async function codeSearch(pattern: string): Promise<string> {
  try {
    // 10 second timeout
    const { stdout } = await execAsync(
      `rg "${pattern}"`,
      { timeout: 10000 }
    );
    return stdout;
  } catch (error: any) {
    if (error.killed) {
      return "Error: Search timed out (>10s). Please refine your pattern.";
    }
    return `Error: ${error.message}`;
  }
}
```

### 4. Path Validation

```typescript
import * as path from "path";

async function codeSearch(
  pattern: string,
  searchPath: string = "."
): Promise<string> {
  // Normalize path
  const safePath = path.normalize(searchPath);

  // Security check
  const cwd = process.cwd();
  const absolutePath = path.resolve(safePath);

  if (!absolutePath.startsWith(cwd)) {
    return "Error: Search path outside working directory";
  }

  // Proceed with search
  const command = `rg "${pattern}" ${safePath}`;
  // ...
}
```

---

## 🎨 Advanced Features

### 1. Search with Context

```typescript
async function codeSearchWithContext(
  pattern: string,
  contextLines: number = 2
): Promise<string> {
  // -C 2 shows 2 lines before and after each match
  const command = `rg -C ${contextLines} "${pattern}"`;

  const { stdout } = await execAsync(command);
  return stdout;
}

// Output:
// agent.ts-83-
// agent.ts-84-// Read file helper
// agent.ts:85:async function readFile(filePath: string): Promise<string> {
// agent.ts-86-  try {
// agent.ts-87-    const content = await fs.readFile(filePath, "utf-8");
```

### 2. Only File Names

```typescript
async function findFilesContaining(pattern: string): Promise<string[]> {
  // -l flag: only file names
  const { stdout } = await execAsync(`rg -l "${pattern}"`);

  return stdout.trim().split("\n");
}

// Usage:
const files = await findFilesContaining("TODO");
// ["agent.ts", "utils.ts", "index.ts"]
```

### 3. Statistics

```typescript
async function codeSearchStats(pattern: string): Promise<{
  totalMatches: number;
  files: number;
  matchesByFile: Map<string, number>;
}> {
  // -c flag: count per file
  const { stdout } = await execAsync(`rg -c "${pattern}"`);

  const matchesByFile = new Map<string, number>();
  let totalMatches = 0;

  for (const line of stdout.trim().split("\n")) {
    const [file, count] = line.split(":");
    const num = parseInt(count, 10);
    matchesByFile.set(file, num);
    totalMatches += num;
  }

  return {
    totalMatches,
    files: matchesByFile.size,
    matchesByFile
  };
}

// Usage:
const stats = await codeSearchStats("async");
console.log(`Found ${stats.totalMatches} async keywords in ${stats.files} files`);
```

### 4. Multi-pattern Search

```typescript
async function codeSearchMultiple(
  patterns: string[]
): Promise<string> {
  // Combine patterns with OR (|)
  const combinedPattern = patterns.join("|");

  const { stdout } = await execAsync(`rg "${combinedPattern}"`);
  return stdout;
}

// Usage:
await codeSearchMultiple(["TODO", "FIXME", "XXX", "HACK"]);
```

---

## 🧪 Testing Code Search

### Test Cases

```bash
# Test 1: Basic search
npx ts-node agent.ts "Search for 'function' in the code"

# Test 2: File type filter
npx ts-node agent.ts "Search for 'import' only in TypeScript files"

# Test 3: Case sensitivity
npx ts-node agent.ts "Search for 'TODO' case-sensitive"

# Test 4: No matches
npx ts-node agent.ts "Search for 'this-definitely-does-not-exist'"

# Test 5: Multiple matches
npx ts-node agent.ts "Search for 'async' and tell me how many there are"

# Test 6: Context
npx ts-node agent.ts "Search for 'readFile' and show me the context"
```

---

## 📊 Complete Tool Definition

```typescript
const codeSearchTool: Tool = {
  name: "code_search",
  description: `Search for code patterns using ripgrep (rg).

This tool is extremely powerful for finding:
- Function definitions and usage
- Variable references
- Import statements
- TODO/FIXME comments
- Security vulnerabilities
- Code patterns for refactoring

The search is:
- Fast (written in Rust)
- Smart (respects .gitignore)
- Flexible (supports regex)

Examples:
- "async function" - Find all async functions
- "import.*Anthropic" - Find Anthropic imports
- "TODO|FIXME" - Find all TODOs and FIXMEs
- "\\bclient\\b" - Find exact word "client"
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
        description: "File type filter: ts, js, py, rs, etc. See ripgrep docs for full list"
      },
      case_sensitive: {
        type: "boolean",
        description: "Case-sensitive search (default: false)"
      },
      max_results: {
        type: "number",
        description: "Maximum number of results (default: 100)"
      },
      context_lines: {
        type: "number",
        description: "Number of context lines before/after match (default: 0)"
      },
      files_only: {
        type: "boolean",
        description: "Show only file names, not match content (default: false)"
      }
    },
    required: ["pattern"]
  }
};
```

---

## 💡 Pro Tips

### 1. Combine with Other Tools

```typescript
// Pattern: Search → Read → Analyze
// 1. Search to find files
const files = await findFilesContaining("async");

// 2. Read interesting files
for (const file of files) {
  const content = await readFile(file);
  // Analyze...
}
```

### 2. Use for Refactoring

```typescript
// User: "Rename all occurrences of oldFunctionName to newFunctionName"

// 1. Search
const matches = await codeSearch("oldFunctionName");

// 2. Edit each file
for (const match of matches) {
  await editFile(
    match.file,
    "oldFunctionName",
    "newFunctionName"
  );
}
```

### 3. Code Quality Analysis

```typescript
// Check code quality metrics
const todos = await codeSearchStats("TODO|FIXME|XXX");
const consoleLog = await codeSearchStats("console\\.log");
const anyType = await codeSearchStats(": any\\b");

console.log(`Code Quality Report:
  TODOs: ${todos.totalMatches}
  Console.logs: ${consoleLog.totalMatches}
  'any' types: ${anyType.totalMatches}
`);
```

---

## 🎓 Practical Exercise

Implement a `code_analyzer` tool that uses `code_search` to:

```typescript
async function analyzeCodebase(): Promise<string> {
  // 1. Count functions
  // 2. Count async functions
  // 3. Count TODO comments
  // 4. Find potential security issues
  // 5. List most imported modules

  // Generate report with all stats
}
```

---

## 📚 Resources

- [ripgrep GitHub](https://github.com/BurntSushi/ripgrep)
- [ripgrep User Guide](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md)
- [Geoffrey's Workshop](https://ghuntley.com/agent/)

---

**Remember**: Code search isn't just "finding text" - it's **understanding code structure**, finding **patterns**, and enabling **intelligent refactoring**! 🔍✨
