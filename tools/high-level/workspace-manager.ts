import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { ToolImplementation } from "../types";

const execAsync = promisify(exec);

export interface WorkspaceOptions {
  action: string;
  template?: string;
  name?: string;
  structure?: any;
  targets?: string[];
  destination?: string;
}

// ============================================
// PROJECT TEMPLATES
// ============================================

export const TEMPLATES = {
  typescript: {
    name: "TypeScript Project",
    files: {
      "src/index.ts": `console.log("Hello TypeScript!");

export {};
`,
      "package.json": (name: string) =>
        JSON.stringify(
          {
            name,
            version: "1.0.0",
            main: "dist/index.js",
            scripts: {
              build: "tsc",
              start: "node dist/index.js",
              dev: "ts-node src/index.ts",
              test: 'echo "No tests yet"',
            },
            devDependencies: {
              "@types/node": "^22.10.5",
              "ts-node": "^10.9.2",
              typescript: "^5.7.3",
            },
          },
          null,
          2
        ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "commonjs",
            outDir: "./dist",
            rootDir: "./src",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ["src/**/*"],
          exclude: ["node_modules", "dist"],
        },
        null,
        2
      ),
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
    setup: ["npm install"],
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
      "package.json": (name: string) =>
        JSON.stringify(
          {
            name,
            version: "1.0.0",
            main: "dist/index.js",
            scripts: {
              build: "tsc",
              start: "node dist/index.js",
              dev: "ts-node src/index.ts",
            },
            dependencies: {
              express: "^4.18.2",
            },
            devDependencies: {
              "@types/express": "^4.17.21",
              "@types/node": "^22.10.5",
              "ts-node": "^10.9.2",
              typescript: "^5.7.3",
            },
          },
          null,
          2
        ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "commonjs",
            outDir: "./dist",
            rootDir: "./src",
            strict: true,
            esModuleInterop: true,
          },
        },
        null,
        2
      ),
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
`,
    },
    setup: ["npm install"],
  },

  node: {
    name: "Node.js Project",
    files: {
      "index.js": `console.log("Hello Node.js!");
`,
      "package.json": (name: string) =>
        JSON.stringify(
          {
            name,
            version: "1.0.0",
            main: "index.js",
            scripts: {
              start: "node index.js",
            },
          },
          null,
          2
        ),
      "README.md": (name: string) => `# ${name}

Node.js project.
`,
      ".gitignore": `node_modules/
*.log
`,
    },
    setup: [],
  },
};

// ============================================
// MAIN WORKSPACE MANAGER
// ============================================

export async function workspaceManager(
  options: WorkspaceOptions
): Promise<string> {
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
// INIT PROJECT
// ============================================

export async function initProject(
  template: string,
  name: string
): Promise<string> {
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
        const fileContent =
          typeof content === "function" ? content(name) : content;

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
${created.map((f) => `  📄 ${f}`).join("\n")}

Next steps:
  cd ${name}
  ${tmpl.setup.length > 0 ? "" : "npm install\n  "}npm run dev
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

export async function scaffoldStructure(structure: any): Promise<string> {
  const created: string[] = [];

  try {
    await createStructureRecursive(structure, ".", created);

    return `✓ Scaffolded structure:

${created.map((item) => `  ${item}`).join("\n")}

Total: ${created.length} items created`;
  } catch (error) {
    return `Error scaffolding: ${(error as Error).message}`;
  }
}

export async function createStructureRecursive(
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

export async function cleanWorkspace(targets: string[]): Promise<string> {
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
    result += `\nDeleted:\n${deleted.map((d) => `  ${d}`).join("\n")}`;
  }

  if (errors.length > 0) {
    result += `\n\nErrors:\n${errors.map((e) => `  ⚠️  ${e}`).join("\n")}`;
  }

  if (deleted.length === 0 && errors.length === 0) {
    result += `\nNo files matched the targets`;
  }

  return result;
}

// ============================================
// ANALYZE PROJECT
// ============================================

export async function analyzeProject(): Promise<string> {
  try {
    const analysis: any = {
      type: "Unknown",
      language: "Unknown",
      framework: "None",
      hasPackageJson: false,
      scripts: [],
      dependencies: { prod: 0, dev: 0 },
      structure: {},
      files: { total: 0, byExt: {} },
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
      hasSrc: items.some((i) => i.isDirectory() && i.name === "src"),
      hasTest: items.some(
        (i) =>
          i.isDirectory() &&
          ["test", "tests", "__tests__"].includes(i.name)
      ),
      hasDist: items.some(
        (i) => i.isDirectory() && ["dist", "build"].includes(i.name)
      ),
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

export function formatAnalysis(a: any): string {
  return `📊 Project Analysis

Type: ${a.type}
Language: ${a.language}
Framework: ${a.framework}

${
  a.hasPackageJson
    ? `Dependencies:
  Production: ${a.dependencies.prod}
  Development: ${a.dependencies.dev}

Scripts: ${a.scripts.join(", ") || "none"}
`
    : "No package.json found\n"
}Structure:
  ${a.structure.hasSrc ? "✓" : "✗"} src/ directory
  ${a.structure.hasTest ? "✓" : "✗"} test/ directory
  ${a.structure.hasDist ? "✓" : "✗"} build/ directory

Files: ${a.files.total} total
${Object.entries(a.files.byExt)
  .sort(([, a]: any, [, b]: any) => b - a)
  .slice(0, 10)
  .map(([ext, count]) => `  ${ext}: ${count}`)
  .join("\n")}
`;
}

export async function getAllFiles(
  dir: string,
  files: string[] = []
): Promise<string[]> {
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

export async function backupProject(destination: string): Promise<string> {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(destination, backupName);

    await fs.mkdir(backupPath, { recursive: true });

    const copied = await copyDir(".", backupPath, [
      "node_modules",
      ".git",
      "dist",
      "build",
      "*.log",
      "backups",
    ]);

    const manifest = {
      timestamp: new Date().toISOString(),
      files: copied.length,
      source: process.cwd(),
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

export async function copyDir(
  src: string,
  dest: string,
  ignore: string[]
): Promise<string[]> {
  const copied: string[] = [];
  await fs.mkdir(dest, { recursive: true });

  const items = await fs.readdir(src, { withFileTypes: true });

  for (const item of items) {
    if (ignore.some((pattern) => item.name.includes(pattern))) continue;

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

// ============================================
// TOOL EXPORT
// ============================================

export const workspaceManagerTool: ToolImplementation = {
  definition: {
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
          description: "The workspace operation to perform",
        },
        template: {
          type: "string",
          enum: ["typescript", "node", "express", "react", "library"],
          description: "Project template (for init)",
        },
        name: {
          type: "string",
          description: "Project name (for init)",
        },
        structure: {
          type: "object",
          description: "Custom structure (for scaffold)",
        },
        targets: {
          type: "array",
          items: { type: "string" },
          description: "Clean targets like ['node_modules', 'dist']",
        },
        destination: {
          type: "string",
          description: "Backup destination path",
        },
      },
      required: ["action"],
    },
  },
  execute: async (input: WorkspaceOptions) => workspaceManager(input),
};
