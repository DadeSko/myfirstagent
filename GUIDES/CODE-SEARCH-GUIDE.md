# 🔍 Code Search Tool - Deep Dive

Guida completa sull'implementazione di un tool di ricerca codice usando ripgrep.

---

## 🎯 Cos'è Code Search?

Il **code search tool** è il **5° primitivo** di un coding agent professionale secondo Geoffrey Huntley.

### Perché è Importante?

```
Senza code_search:
  User: "Trova tutte le funzioni async nel progetto"
  Agent: "Non posso cercare nel codice" ❌

Con code_search:
  User: "Trova tutte le funzioni async nel progetto"
  Agent: [cerca "async function"] 
         "Trovate 23 occorrenze in 8 file!" ✅
```

**Use Cases Reali:**
- 🔍 Trovare definizioni di funzioni
- 📝 Cercare usage di variabili
- 🐛 Localizzare bug patterns
- 📊 Analisi codice (quanti TODO?, quanti console.log?)
- ♻️ Refactoring (trovare tutti gli usi di una API)

---

## 🛠️ La Tecnologia: ripgrep (rg)

### Cos'è ripgrep?

**ripgrep** (command: `rg`) è un tool di ricerca testo ultra-veloce:
- ✅ Scritto in Rust → velocissimo
- ✅ Rispetta .gitignore automaticamente
- ✅ Syntax highlighting
- ✅ Ricerca ricorsiva intelligente
- ✅ Regex support

### Geoffrey's Insight

> "What if I were to tell you that there is no magic for indexing source code or any intelligence? Nearly every coding tool currently available uses the open source ripgrep binary under the hood."

**Tutti usano ripgrep:**
- Cursor
- GitHub Copilot
- Windsurf
- Claude Code
- VS Code search

---

## 📦 Installazione ripgrep

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
# Con Chocolatey
choco install ripgrep

# Con Scoop
scoop install ripgrep

# O download da GitHub releases
```

### Verifica Installazione
```bash
rg --version
# Output: ripgrep 14.1.0
```

---

## 🔧 Implementazione Base

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

### Implementazione Base

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
    // Costruisci comando ripgrep
    let command = "rg";
    
    // Case insensitive di default
    if (!caseSensitive) {
      command += " -i";
    }
    
    // Aggiungi tipo file se specificato
    if (fileType) {
      command += ` -t ${fileType}`;
    }
    
    // Aggiungi pattern (quoted per sicurezza)
    command += ` "${pattern}"`;
    
    // Aggiungi path
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
    
    // ripgrep exit code 1 = no matches found (non è un errore!)
    if (err.code === 1) {
      return `No matches found for pattern: ${pattern}`;
    }
    
    return `Error searching: ${err.message}`;
  }
}
```

---

## 🎨 Implementazione Avanzata

### Con Tutte le Opzioni ripgrep

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
    // Costruisci comando
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
    
    // Files only (solo nomi file, non contenuto)
    if (filesOnly) {
      args.push("-l");
    }
    
    // Invert match
    if (invertMatch) {
      args.push("-v");
    }
    
    // Line numbers
    args.push("-n");
    
    // Color output (per terminal display)
    args.push("--color=never");
    
    // Pattern e path
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

## 📊 ripgrep Flags Essenziali

### Flags Più Comuni

```bash
# Case insensitive
rg -i "pattern"

# Solo file TypeScript
rg -tts "pattern"

# Solo file JavaScript
rg -tjs "pattern"

# Multiple file types
rg -tts -tjs "pattern"

# Max risultati
rg -m 10 "pattern"

# Context lines (before/after)
rg -C 2 "pattern"        # 2 linee prima e dopo
rg -B 2 "pattern"        # 2 linee prima
rg -A 2 "pattern"        # 2 linee dopo

# Solo nomi file (senza contenuto)
rg -l "pattern"

# Conta occorrenze
rg -c "pattern"

# Invert match (trova linee CHE NON matchano)
rg -v "pattern"

# Fixed string (non regex)
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
# Definisci custom type
rg --type-add 'config:*.{yml,yaml,toml,json}' -tconfig "pattern"
```

---

## 🎯 Use Cases Real-World

### 1. Trova Definizioni di Funzioni

```typescript
// User: "Trova dove è definita la funzione readFile"
await codeSearch({
  pattern: "^(async )?function readFile",
  fileType: "ts"
});

// Output:
// agent.ts:85:async function readFile(filePath: string): Promise<string> {
```

### 2. Trova Tutti i TODO

```typescript
// User: "Quanti TODO ci sono nel progetto?"
await codeSearch({
  pattern: "TODO|FIXME|XXX",
  caseSensitive: false
});

// Output:
// agent.ts:120:// TODO: Add retry logic
// utils.ts:45:// FIXME: Handle edge case
// index.ts:12:// XXX: Temporary hack
```

### 3. Trova Imports da un Package

```typescript
// User: "Trova tutti i file che importano da Anthropic"
await codeSearch({
  pattern: 'import.*from.*"@anthropic-ai/sdk"',
  fileType: "ts"
});

// Output:
// agent.ts:1:import Anthropic from "@anthropic-ai/sdk";
// test.ts:3:import Anthropic from "@anthropic-ai/sdk";
```

### 4. Trova Usage di una Variabile

```typescript
// User: "Dove viene usata la variabile 'client'?"
await codeSearch({
  pattern: "\\bclient\\b",  // Word boundary
  fileType: "ts"
});

// Output:
// agent.ts:12:const client = new Anthropic({
// agent.ts:145:  const response = await client.messages.create({
```

### 5. Analisi Sicurezza

```typescript
// User: "Cerca potenziali security issues"
await codeSearch({
  pattern: "eval\\(|innerHTML|dangerouslySetInnerHTML"
});

// Output:
// app.tsx:56:  div.innerHTML = userInput;  // ⚠️ XSS risk!
```

---

## 🔬 Parsing Output di ripgrep

### Output Format

```
file_path:line_number:matched_line_content
```

Esempio:
```
agent.ts:85:async function readFile(filePath: string): Promise<string> {
agent.ts:120:  console.log("Reading file...");
utils.ts:12:function processFile(path: string) {
```

### Parser Avanzato

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

// Uso:
async function codeSearchParsed(pattern: string): Promise<SearchMatch[]> {
  const output = await codeSearch({ pattern });
  return parseRipgrepOutput(output);
}
```

### Formatted Output per Claude

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
  // Se user input è literal string, escape it
  const escapedPattern = escapeRegex(pattern);
  
  // Usa -F per literal search (no regex)
  const command = `rg -F "${escapedPattern}"`;
  // ...
}
```

### 2. Limit Results

```typescript
async function codeSearch(pattern: string): Promise<string> {
  const MAX_RESULTS = 500;
  
  // Usa -m flag per limitare
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
    // Timeout di 10 secondi
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

### 1. Search con Context

```typescript
async function codeSearchWithContext(
  pattern: string,
  contextLines: number = 2
): Promise<string> {
  // -C 2 mostra 2 linee prima e dopo ogni match
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
  // -l flag: solo nomi file
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
  // Combina patterns con OR (|)
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
npx ts-node agent.ts "Cerca 'function' nel codice"

# Test 2: File type filter
npx ts-node agent.ts "Cerca 'import' solo nei file TypeScript"

# Test 3: Case sensitivity
npx ts-node agent.ts "Cerca 'TODO' case-sensitive"

# Test 4: No matches
npx ts-node agent.ts "Cerca 'this-definitely-does-not-exist'"

# Test 5: Multiple matches
npx ts-node agent.ts "Cerca 'async' e dimmi quante ce ne sono"

# Test 6: Context
npx ts-node agent.ts "Cerca 'readFile' e mostrami il contesto"
```

---

## 📊 Tool Definition Completo

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

### 1. Combine con Altri Tool

```typescript
// Pattern: Search → Read → Analyze
// 1. Search per trovare file
const files = await findFilesContaining("async");

// 2. Read file interessanti
for (const file of files) {
  const content = await readFile(file);
  // Analyze...
}
```

### 2. Usa per Refactoring

```typescript
// User: "Rinomina tutte le occorrenze di oldFunctionName con newFunctionName"

// 1. Search
const matches = await codeSearch("oldFunctionName");

// 2. Edit ogni file
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

## 🎓 Esercizio Pratico

Implementa un tool `code_analyzer` che usa `code_search` per:

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

## 📚 Risorse

- [ripgrep GitHub](https://github.com/BurntSushi/ripgrep)
- [ripgrep User Guide](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md)
- [Geoffrey's Workshop](https://ghuntley.com/agent/)

---

**Remember**: Code search non è solo "trovare testo" - è **comprendere la struttura** del codice, trovare **pattern**, e abilitare **refactoring intelligente**! 🔍✨