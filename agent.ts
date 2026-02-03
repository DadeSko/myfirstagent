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


// HIGH-LEVEL TOOL: Workspace Manager
const workspaceManagerTool: Tool = {
  name: "workspace_manager",
  description: `Manage workspace and project structures intelligently.
  
This high-level tool orchestrates multiple operations:

ACTIONS:
- init: Create new project from template (typescript, node, express, react, library)
- scaffold: Create custom directory/file structure
- clean: Remove temporary files and build artifacts
- analyze: Analyze project structure and dependencies
- backup: Create timestamped backup of project

USE CASES:
- "Create a new TypeScript project called my-app"
- "Set up an Express API structure"
- "Clean all node_modules and build files"
- "Analyze this project"
- "Backup the project before refactoring"

This tool saves time by automating complex multi-step operations.
`,
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["init", "scaffold", "clean", "analyze", "backup"],
        description: "The workspace operation to perform"
      },
      template: {
        type: "string",
        enum: ["typescript", "node", "express", "react", "library"],
        description: "Project template (for init)"
      },
      name: {
        type: "string",
        description: "Project name (for init)"
      },
      structure: {
        type: "object",
        description: "Custom structure (for scaffold)"
      },
      targets: {
        type: "array",
        items: { type: "string" },
        description: "Clean targets like ['node_modules', 'dist']"
      },
      destination: {
        type: "string",
        description: "Backup destination path"
      }
    },
    required: ["action"]
  }
};

// ============================================
// PROJECT TEMPLATES
// ============================================

const TEMPLATES = {
  typescript: {
    name: "TypeScript Project",
    files: {
      "src/index.ts": `console.log("Hello TypeScript!");

export {};
`,
      "package.json": (name: string) => JSON.stringify({
        name,
        version: "1.0.0",
        main: "dist/index.js",
        scripts: {
          build: "tsc",
          start: "node dist/index.js",
          dev: "ts-node src/index.ts",
          test: "echo \"No tests yet\""
        },
        devDependencies: {
          "@types/node": "^22.10.5",
          "ts-node": "^10.9.2",
          "typescript": "^5.7.3"
        }
      }, null, 2),
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "commonjs",
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"]
      }, null, 2),
      "README.md": (name: string) => `# ${name}

TypeScript project created with workspace_manager.

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm start
\`\`\`
`,
      ".gitignore": `node_modules/
dist/
*.log
.env
.DS_Store
`,
    },
    setup: ["npm install"]
  },
  
  express: {
    name: "Express API",
    files: {
      "src/index.ts": `import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});
`,
      "src/routes/.gitkeep": "",
      "src/middleware/.gitkeep": "",
      "src/controllers/.gitkeep": "",
      "package.json": (name: string) => JSON.stringify({
        name,
        version: "1.0.0",
        main: "dist/index.js",
        scripts: {
          build: "tsc",
          start: "node dist/index.js",
          dev: "ts-node src/index.ts"
        },
        dependencies: {
          "express": "^4.18.2"
        },
        devDependencies: {
          "@types/express": "^4.17.21",
          "@types/node": "^22.10.5",
          "ts-node": "^10.9.2",
          "typescript": "^5.7.3"
        }
      }, null, 2),
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "commonjs",
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true
        }
      }, null, 2),
      "README.md": (name: string) => `# ${name}

Express API created with workspace_manager.

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

API will be available at http://localhost:3000
`,
      ".env.example": `PORT=3000
NODE_ENV=development
`,
      ".gitignore": `node_modules/
dist/
*.log
.env
`
    },
    setup: ["npm install"]
  },
  
  node: {
    name: "Node.js Project", 
    files: {
      "index.js": `console.log("Hello Node.js!");
`,
      "package.json": (name: string) => JSON.stringify({
        name,
        version: "1.0.0",
        main: "index.js",
        scripts: {
          start: "node index.js"
        }
      }, null, 2),
      "README.md": (name: string) => `# ${name}

Node.js project.
`,
      ".gitignore": `node_modules/
*.log
`
    },
    setup: []
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

interface WorkspaceOptions {
  action: string;
  template?: string;
  name?: string;
  structure?: any;
  targets?: string[];
  destination?: string;
}

async function workspaceManager(options: WorkspaceOptions): Promise<string> {
  try {
    switch (options.action) {
      case "init":
        if (!options.template || !options.name) {
          return "Error: init requires 'template' and 'name'";
        }
        return await initProject(options.template, options.name);
      
      case "scaffold":
        if (!options.structure) {
          return "Error: scaffold requires 'structure'";
        }
        return await scaffoldStructure(options.structure);
      
      case "clean":
        if (!options.targets) {
          return "Error: clean requires 'targets' array";
        }
        return await cleanWorkspace(options.targets);
      
      case "analyze":
        return await analyzeProject();
      
      case "backup":
        const dest = options.destination || "./backups";
        return await backupProject(dest);
      
      default:
        return `Unknown action: ${options.action}`;
    }
  } catch (error) {
    return `Error in workspace_manager: ${(error as Error).message}`;
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


// ============================================
// INIT PROJECT
// ============================================

async function initProject(template: string, name: string): Promise<string> {
  try {
    console.log(`🚀 Initializing ${template} project: ${name}`);
    
    const tmpl = TEMPLATES[template as keyof typeof TEMPLATES];
    if (!tmpl) {
      const available = Object.keys(TEMPLATES).join(", ");
      return `Error: Unknown template '${template}'. Available: ${available}`;
    }
    
    // Check if directory already exists
    try {
      await fs.access(name);
      return `Error: Directory '${name}' already exists`;
    } catch {
      // Good, doesn't exist
    }
    
    // Create project directory
    await fs.mkdir(name, { recursive: true });
    const originalCwd = process.cwd();
    
    try {
      process.chdir(name);
      
      // Create all files
      const created: string[] = [];
      for (const [filepath, content] of Object.entries(tmpl.files)) {
        // Get content (might be function for dynamic content)
        const fileContent = typeof content === "function" 
          ? content(name) 
          : content;
        
        // Create directory if needed
        const dir = path.dirname(filepath);
        if (dir !== ".") {
          await fs.mkdir(dir, { recursive: true });
        }
        
        // Write file
        await fs.writeFile(filepath, fileContent, "utf-8");
        created.push(filepath);
      }
      
      // Run setup commands
      for (const cmd of tmpl.setup) {
        console.log(`⚙️  Running: ${cmd}`);
        await execAsync(cmd);
      }
      
      // Git init
      try {
        await execAsync("git init");
        await fs.writeFile(".git/description", name);
        console.log("✓ Git initialized");
      } catch {
        // Git not available
      }
      
      process.chdir(originalCwd);
      
      return `✓ Created ${tmpl.name}: ${name}

Files created:
${created.map(f => `  📄 ${f}`).join('\n')}

Next steps:
  cd ${name}
  ${tmpl.setup.length > 0 ? '' : 'npm install\n  '}npm run dev
`;
      
    } catch (error) {
      process.chdir(originalCwd);
      // Cleanup on failure
      await fs.rm(name, { recursive: true, force: true });
      throw error;
    }
    
  } catch (error) {
    return `Error initializing project: ${(error as Error).message}`;
  }
}

// ============================================
// SCAFFOLD STRUCTURE
// ============================================

async function scaffoldStructure(structure: any): Promise<string> {
  const created: string[] = [];
  
  try {
    await createStructureRecursive(structure, ".", created);
    
    return `✓ Scaffolded structure:

${created.map(item => `  ${item}`).join('\n')}

Total: ${created.length} items created`;
    
  } catch (error) {
    return `Error scaffolding: ${(error as Error).message}`;
  }
}

async function createStructureRecursive(
  structure: any,
  basePath: string,
  created: string[]
): Promise<void> {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(basePath, key);
    
    if (key.endsWith("/")) {
      // Directory
      const dirPath = fullPath.slice(0, -1);
      await fs.mkdir(dirPath, { recursive: true });
      created.push(`📁 ${dirPath}`);
      
      if (typeof value === "object") {
        await createStructureRecursive(value, dirPath, created);
      }
    } else {
      // File
      const content = typeof value === "string" ? value : "";
      await fs.writeFile(fullPath, content, "utf-8");
      created.push(`📄 ${fullPath}`);
    }
  }
}

// ============================================
// CLEAN WORKSPACE
// ============================================

async function cleanWorkspace(targets: string[]): Promise<string> {
  const deleted: string[] = [];
  const errors: string[] = [];
  
  for (const target of targets) {
    try {
      const stats = await fs.stat(target);
      
      if (stats.isDirectory()) {
        await fs.rm(target, { recursive: true, force: true });
        deleted.push(`📁 ${target}/`);
      } else {
        await fs.unlink(target);
        deleted.push(`📄 ${target}`);
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        errors.push(`${target}: ${error.message}`);
      }
    }
  }
  
  let result = `✓ Workspace cleaned\n`;
  
  if (deleted.length > 0) {
    result += `\nDeleted:\n${deleted.map(d => `  ${d}`).join('\n')}`;
  }
  
  if (errors.length > 0) {
    result += `\n\nErrors:\n${errors.map(e => `  ⚠️  ${e}`).join('\n')}`;
  }
  
  if (deleted.length === 0 && errors.length === 0) {
    result += `\nNo files matched the targets`;
  }
  
  return result;
}

// ============================================
// ANALYZE PROJECT
// ============================================

async function analyzeProject(): Promise<string> {
  try {
    const analysis: any = {
      type: "Unknown",
      language: "Unknown",
      framework: "None",
      hasPackageJson: false,
      scripts: [],
      dependencies: { prod: 0, dev: 0 },
      structure: {},
      files: { total: 0, byExt: {} }
    };
    
    // Check package.json
    try {
      const pkg = JSON.parse(await fs.readFile("package.json", "utf-8"));
      analysis.hasPackageJson = true;
      analysis.type = "Node.js";
      analysis.scripts = Object.keys(pkg.scripts || {});
      analysis.dependencies.prod = Object.keys(pkg.dependencies || {}).length;
      analysis.dependencies.dev = Object.keys(pkg.devDependencies || {}).length;
      
      // Detect framework
      if (pkg.dependencies?.react) analysis.framework = "React";
      else if (pkg.dependencies?.express) analysis.framework = "Express";
      else if (pkg.dependencies?.next) analysis.framework = "Next.js";
      
      // Detect language
      if (pkg.devDependencies?.typescript) analysis.language = "TypeScript";
      else analysis.language = "JavaScript";
    } catch {}
    
    // Analyze structure
    const items = await fs.readdir(".", { withFileTypes: true });
    analysis.structure = {
      hasSrc: items.some(i => i.isDirectory() && i.name === "src"),
      hasTest: items.some(i => i.isDirectory() && ["test", "tests", "__tests__"].includes(i.name)),
      hasDist: items.some(i => i.isDirectory() && ["dist", "build"].includes(i.name)),
    };
    
    // Count files
    const files = await getAllFiles(".");
    analysis.files.total = files.length;
    for (const file of files) {
      const ext = path.extname(file) || "(no ext)";
      analysis.files.byExt[ext] = (analysis.files.byExt[ext] || 0) + 1;
    }
    
    return formatAnalysis(analysis);
    
  } catch (error) {
    return `Error analyzing: ${(error as Error).message}`;
  }
}

function formatAnalysis(a: any): string {
  return `📊 Project Analysis

Type: ${a.type}
Language: ${a.language}
Framework: ${a.framework}

${a.hasPackageJson ? `Dependencies:
  Production: ${a.dependencies.prod}
  Development: ${a.dependencies.dev}

Scripts: ${a.scripts.join(", ") || "none"}
` : "No package.json found\n"}
Structure:
  ${a.structure.hasSrc ? "✓" : "✗"} src/ directory
  ${a.structure.hasTest ? "✓" : "✗"} test/ directory
  ${a.structure.hasDist ? "✓" : "✗"} build/ directory

Files: ${a.files.total} total
${Object.entries(a.files.byExt)
  .sort(([,a]: any, [,b]: any) => b - a)
  .slice(0, 10)
  .map(([ext, count]) => `  ${ext}: ${count}`)
  .join('\n')}
`;
}

async function getAllFiles(dir: string, files: string[] = []): Promise<string[]> {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    if (["node_modules", ".git", "dist", "build"].includes(item.name)) continue;
    
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      await getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

// ============================================
// BACKUP PROJECT
// ============================================

async function backupProject(destination: string): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(destination, backupName);
    
    await fs.mkdir(backupPath, { recursive: true });
    
    const copied = await copyDir(".", backupPath, [
      "node_modules", ".git", "dist", "build", "*.log", "backups"
    ]);
    
    const manifest = {
      timestamp: new Date().toISOString(),
      files: copied.length,
      source: process.cwd()
    };
    
    await fs.writeFile(
      path.join(backupPath, "BACKUP-INFO.json"),
      JSON.stringify(manifest, null, 2)
    );
    
    return `✓ Backup created: ${backupPath}

Files: ${copied.length}
Date: ${timestamp}
`;
    
  } catch (error) {
    return `Error creating backup: ${(error as Error).message}`;
  }
}

async function copyDir(src: string, dest: string, ignore: string[]): Promise<string[]> {
  const copied: string[] = [];
  await fs.mkdir(dest, { recursive: true });
  
  const items = await fs.readdir(src, { withFileTypes: true });
  
  for (const item of items) {
    if (ignore.some(pattern => item.name.includes(pattern))) continue;
    
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    if (item.isDirectory()) {
      const sub = await copyDir(srcPath, destPath, ignore);
      copied.push(...sub);
    } else {
      await fs.copyFile(srcPath, destPath);
      copied.push(srcPath);
    }
  }
  
  return copied;
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
      case "workspace_manager":
  return await workspaceManager({
    action: toolInput.action,
    template: toolInput.template,
    name: toolInput.name,
    structure: toolInput.structure,
    targets: toolInput.targets,
    destination: toolInput.destination
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

  const tools = [readFileTool, listFilesTool, bashTool, editFileTool, codeSearchTool, workspaceManagerTool];

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
