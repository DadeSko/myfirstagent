# 🗂️ Workspace Manager Tool - Deep Dive

Complete guide on implementing a tool to manage workspaces and project structures.

---

## 🎯 What is Workspace Manager?

The **workspace_manager** is a **meta-tool** that orchestrates other primitives for complex project operations:

### Without workspace_manager:
```
User: "Create a new TypeScript project"
Agent: [10+ manual tool calls]
  → mkdir
  → create package.json
  → create tsconfig.json
  → create src/
  → create README.md
  → ...
```

### With workspace_manager:
```
User: "Create a new TypeScript project"
Agent: [1 intelligent tool call]
  → workspace_manager({ action: "init", template: "typescript" })
  → Everything created automatically! ✅
```

---

## 🏗️ Architecture Overview

```
workspace_manager
    ↓
Orchestrates:
    ├─ mkdir (create directories)
    ├─ edit_file (create files)
    ├─ list_files (verify structure)
    ├─ bash (npm install, git init)
    └─ code_search (analyze existing code)
```

**Pattern:** High-level tool that composes low-level primitives.

---

## 🛠️ Core Operations

### 1. **init** - Initialize Project

Creates a new project structure from a template.

```typescript
workspace_manager({
  action: "init",
  template: "typescript",
  name: "my-project"
})
```

**Supported Templates:**
- `typescript` - TypeScript project
- `node` - Node.js project
- `react` - React app
- `express` - Express API
- `library` - NPM library

### 2. **scaffold** - Create Structure

Creates a specific directory/file structure.

```typescript
workspace_manager({
  action: "scaffold",
  structure: {
    "src/": {
      "index.ts": "export {}",
      "utils/": {
        "helpers.ts": "// helpers"
      }
    }
  }
})
```

### 3. **clean** - Clean Workspace

Removes temporary files, build artifacts, etc.

```typescript
workspace_manager({
  action: "clean",
  targets: ["node_modules", "dist", "*.log"]
})
```

### 4. **analyze** - Analyze Project

Analyzes project structure and dependencies.

```typescript
workspace_manager({
  action: "analyze"
})
```

### 5. **backup** - Backup Project

Creates a workspace backup.

```typescript
workspace_manager({
  action: "backup",
  destination: "./backups"
})
```

---

## 📋 Tool Definition

```typescript
const workspaceManagerTool: Tool = {
  name: "workspace_manager",
  description: `Manage workspace and project structures.

This is a high-level tool that orchestrates multiple operations:
- Initialize new projects from templates
- Scaffold directory and file structures
- Clean temporary files and build artifacts
- Analyze project structure and dependencies
- Create backups

Use this when the user wants to:
- Create a new project ("create a TypeScript project")
- Set up a specific folder structure
- Clean up the workspace
- Analyze the current project structure
- Backup the project

Examples:
- "Create a new TypeScript project called my-app"
- "Set up an Express API structure"
- "Clean all node_modules and build files"
- "Analyze this project and tell me about it"
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
        enum: ["typescript", "node", "react", "express", "library"],
        description: "Project template (for init action)"
      },
      name: {
        type: "string",
        description: "Project name (for init action)"
      },
      structure: {
        type: "object",
        description: "Directory/file structure (for scaffold action)"
      },
      targets: {
        type: "array",
        items: { type: "string" },
        description: "Targets to clean (for clean action)"
      },
      destination: {
        type: "string",
        description: "Backup destination (for backup action)"
      }
    },
    required: ["action"]
  }
};
```

---

## 💻 Implementation

### Core Function

```typescript
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface WorkspaceManagerOptions {
  action: "init" | "scaffold" | "clean" | "analyze" | "backup";
  template?: string;
  name?: string;
  structure?: Record<string, any>;
  targets?: string[];
  destination?: string;
}

async function workspaceManager(
  options: WorkspaceManagerOptions
): Promise<string> {
  try {
    switch (options.action) {
      case "init":
        return await initProject(options.template!, options.name!);

      case "scaffold":
        return await scaffoldStructure(options.structure!);

      case "clean":
        return await cleanWorkspace(options.targets!);

      case "analyze":
        return await analyzeProject();

      case "backup":
        return await backupProject(options.destination!);

      default:
        return `Unknown action: ${options.action}`;
    }
  } catch (error) {
    return `Error in workspace_manager: ${(error as Error).message}`;
  }
}
```

---

## 🎨 Feature 1: Project Initialization

### Templates

```typescript
const TEMPLATES = {
  typescript: {
    name: "TypeScript Project",
    structure: {
      "src/": {
        "index.ts": `console.log("Hello TypeScript!");`,
      },
      "package.json": (name: string) => JSON.stringify({
        name,
        version: "1.0.0",
        main: "dist/index.js",
        scripts: {
          build: "tsc",
          start: "node dist/index.js",
          dev: "ts-node src/index.ts"
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
          skipLibCheck: true
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"]
      }, null, 2),
      "README.md": (name: string) => `# ${name}\n\nTypeScript project\n`,
      ".gitignore": `node_modules/\ndist/\n*.log\n.env\n`
    },
    setup: ["npm install"]
  },

  node: {
    name: "Node.js Project",
    structure: {
      "src/": {
        "index.js": `console.log("Hello Node!");`,
      },
      "package.json": (name: string) => JSON.stringify({
        name,
        version: "1.0.0",
        main: "src/index.js",
        scripts: {
          start: "node src/index.js"
        }
      }, null, 2),
      "README.md": (name: string) => `# ${name}\n\nNode.js project\n`,
      ".gitignore": `node_modules/\n*.log\n.env\n`
    },
    setup: []
  },

  express: {
    name: "Express API",
    structure: {
      "src/": {
        "index.ts": `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
        "routes/": {},
        "middleware/": {},
        "controllers/": {}
      },
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
      "README.md": (name: string) => `# ${name}\n\nExpress API\n`,
      ".gitignore": `node_modules/\ndist/\n*.log\n.env\n`,
      ".env.example": `PORT=3000\n`
    },
    setup: ["npm install"]
  }
};
```

### Implementation

```typescript
async function initProject(
  template: string,
  name: string
): Promise<string> {
  try {
    console.log(`🚀 Initializing ${template} project: ${name}`);

    // Get template
    const tmpl = TEMPLATES[template as keyof typeof TEMPLATES];
    if (!tmpl) {
      return `Error: Unknown template '${template}'`;
    }

    // Create project directory
    await fs.mkdir(name, { recursive: true });
    process.chdir(name);

    // Create structure
    const filesCreated = await createStructure(tmpl.structure, name);

    // Run setup commands
    for (const cmd of tmpl.setup) {
      console.log(`⚙️  Running: ${cmd}`);
      await execAsync(cmd);
    }

    // Initialize git
    try {
      await execAsync("git init");
      console.log("✓ Git initialized");
    } catch {
      // Git not available, skip
    }

    const result = `✓ Created ${tmpl.name}: ${name}

Files created:
${filesCreated.map(f => `  - ${f}`).join('\n')}

Next steps:
  cd ${name}
  npm run dev
`;

    console.log(result);
    return result;

  } catch (error) {
    return `Error initializing project: ${(error as Error).message}`;
  }
}
```

---

## 🏗️ Feature 2: Scaffold Structure

### Recursive Structure Creation

```typescript
async function scaffoldStructure(
  structure: Record<string, any>,
  basePath: string = "."
): Promise<string> {
  const filesCreated: string[] = [];

  try {
    await createStructureRecursive(structure, basePath, filesCreated);

    return `✓ Scaffolded structure:
${filesCreated.map(f => `  - ${f}`).join('\n')}

Total: ${filesCreated.length} items created`;

  } catch (error) {
    return `Error scaffolding structure: ${(error as Error).message}`;
  }
}

async function createStructureRecursive(
  structure: Record<string, any>,
  basePath: string,
  filesCreated: string[]
): Promise<void> {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(basePath, key);

    if (key.endsWith("/")) {
      // Directory
      const dirPath = fullPath.slice(0, -1);
      await fs.mkdir(dirPath, { recursive: true });
      filesCreated.push(`📁 ${dirPath}`);

      // Recurse into subdirectory
      if (typeof value === "object" && !Array.isArray(value)) {
        await createStructureRecursive(value, dirPath, filesCreated);
      }

    } else {
      // File
      const content = typeof value === "string" ? value : "";
      await fs.writeFile(fullPath, content, "utf-8");
      filesCreated.push(`📄 ${fullPath}`);
    }
  }
}
```

### Usage Example

```typescript
// User: "Create a feature module structure"
await workspaceManager({
  action: "scaffold",
  structure: {
    "features/": {
      "auth/": {
        "index.ts": "export * from './auth';",
        "auth.ts": "// Auth logic",
        "auth.test.ts": "// Tests"
      },
      "users/": {
        "index.ts": "export * from './users';",
        "users.ts": "// User logic",
        "users.test.ts": "// Tests"
      }
    }
  }
});
```

---

## 🧹 Feature 3: Clean Workspace

```typescript
async function cleanWorkspace(targets: string[]): Promise<string> {
  const deleted: string[] = [];
  const errors: string[] = [];

  try {
    for (const target of targets) {
      try {
        // Check if target exists
        const exists = await fileExists(target);
        if (!exists) {
          continue;
        }

        const stats = await fs.stat(target);

        if (stats.isDirectory()) {
          await fs.rm(target, { recursive: true, force: true });
          deleted.push(`📁 ${target}/`);
        } else {
          await fs.unlink(target);
          deleted.push(`📄 ${target}`);
        }

      } catch (error) {
        errors.push(`Failed to delete ${target}: ${(error as Error).message}`);
      }
    }

    let result = `✓ Cleaned workspace:\n`;

    if (deleted.length > 0) {
      result += `\nDeleted:\n${deleted.map(d => `  - ${d}`).join('\n')}`;
    }

    if (errors.length > 0) {
      result += `\n\nErrors:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    }

    return result;

  } catch (error) {
    return `Error cleaning workspace: ${(error as Error).message}`;
  }
}

// Helper
async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
```

### Common Clean Patterns

```typescript
// Clean build artifacts
await workspaceManager({
  action: "clean",
  targets: ["dist", "build", "*.tsbuildinfo"]
});

// Clean dependencies (for reinstall)
await workspaceManager({
  action: "clean",
  targets: ["node_modules", "package-lock.json"]
});

// Clean logs and temp files
await workspaceManager({
  action: "clean",
  targets: ["*.log", "tmp", ".cache"]
});
```

---

## 🔍 Feature 4: Analyze Project

```typescript
async function analyzeProject(): Promise<string> {
  try {
    console.log("🔍 Analyzing project...");

    const analysis = {
      type: "unknown",
      language: "unknown",
      framework: "unknown",
      structure: {} as any,
      dependencies: {} as any,
      scripts: {} as any,
      files: {
        total: 0,
        byType: {} as Record<string, number>
      }
    };

    // Detect project type from package.json
    const pkgExists = await fileExists("package.json");
    if (pkgExists) {
      const pkgContent = await fs.readFile("package.json", "utf-8");
      const pkg = JSON.parse(pkgContent);

      analysis.type = "Node.js";
      analysis.dependencies = {
        production: Object.keys(pkg.dependencies || {}).length,
        development: Object.keys(pkg.devDependencies || {}).length
      };
      analysis.scripts = Object.keys(pkg.scripts || {});

      // Detect framework/language
      if (pkg.dependencies?.["react"]) {
        analysis.framework = "React";
      } else if (pkg.dependencies?.["express"]) {
        analysis.framework = "Express";
      } else if (pkg.dependencies?.["next"]) {
        analysis.framework = "Next.js";
      }

      if (pkg.devDependencies?.["typescript"]) {
        analysis.language = "TypeScript";
      } else {
        analysis.language = "JavaScript";
      }
    }

    // Analyze file structure
    const files = await getAllFiles(".");
    analysis.files.total = files.length;

    for (const file of files) {
      const ext = path.extname(file);
      analysis.files.byType[ext] = (analysis.files.byType[ext] || 0) + 1;
    }

    // Detect directory structure
    const dirs = await fs.readdir(".", { withFileTypes: true });
    analysis.structure = {
      hasSrc: dirs.some(d => d.isDirectory() && d.name === "src"),
      hasTests: dirs.some(d => d.isDirectory() && (d.name === "test" || d.name === "__tests__")),
      hasDist: dirs.some(d => d.isDirectory() && (d.name === "dist" || d.name === "build")),
      hasPublic: dirs.some(d => d.isDirectory() && d.name === "public")
    };

    // Format result
    return formatAnalysis(analysis);

  } catch (error) {
    return `Error analyzing project: ${(error as Error).message}`;
  }
}

function formatAnalysis(analysis: any): string {
  return `📊 Project Analysis:

Type: ${analysis.type}
Language: ${analysis.language}
Framework: ${analysis.framework}

Dependencies:
  - Production: ${analysis.dependencies.production}
  - Development: ${analysis.dependencies.development}

Scripts available: ${analysis.scripts.join(", ")}

Structure:
  ${analysis.structure.hasSrc ? "✓" : "✗"} src/ directory
  ${analysis.structure.hasTests ? "✓" : "✗"} test/ directory
  ${analysis.structure.hasDist ? "✓" : "✗"} build output
  ${analysis.structure.hasPublic ? "✓" : "✗"} public/ directory

Files:
  - Total: ${analysis.files.total}
  - By type:
${Object.entries(analysis.files.byType)
  .map(([ext, count]) => `    ${ext || "(no ext)"}: ${count}`)
  .join('\n')}
`;
}

// Helper: Get all files recursively
async function getAllFiles(
  dir: string,
  fileList: string[] = []
): Promise<string[]> {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    // Skip common ignored directories
    if (file.isDirectory() &&
        ["node_modules", ".git", "dist", "build"].includes(file.name)) {
      continue;
    }

    if (file.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}
```

---

## 💾 Feature 5: Backup Project

```typescript
async function backupProject(destination: string): Promise<string> {
  try {
    console.log(`💾 Creating backup to ${destination}`);

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(destination, backupName);

    await fs.mkdir(backupPath, { recursive: true });

    // Copy files (excluding common ignore patterns)
    const filesCopied = await copyDirectory(".", backupPath, [
      "node_modules",
      ".git",
      "dist",
      "build",
      "*.log"
    ]);

    // Create manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      files: filesCopied.length,
      source: process.cwd()
    };

    await fs.writeFile(
      path.join(backupPath, "backup-manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    return `✓ Backup created: ${backupPath}

Files backed up: ${filesCopied.length}
Timestamp: ${timestamp}

To restore:
  cp -r ${backupPath}/* .
`;

  } catch (error) {
    return `Error creating backup: ${(error as Error).message}`;
  }
}

async function copyDirectory(
  src: string,
  dest: string,
  ignore: string[]
): Promise<string[]> {
  const copied: string[] = [];

  await fs.mkdir(dest, { recursive: true });
  const files = await fs.readdir(src, { withFileTypes: true });

  for (const file of files) {
    // Check ignore patterns
    if (ignore.some(pattern => file.name.includes(pattern))) {
      continue;
    }

    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);

    if (file.isDirectory()) {
      const subCopied = await copyDirectory(srcPath, destPath, ignore);
      copied.push(...subCopied);
    } else {
      await fs.copyFile(srcPath, destPath);
      copied.push(srcPath);
    }
  }

  return copied;
}
```

---

## 🧪 Testing

```bash
# Test 1: Initialize TypeScript project
npx ts-node agent.ts "Create a new TypeScript project called my-app"

# Test 2: Scaffold structure
npx ts-node agent.ts "Create a features folder with auth and users modules"

# Test 3: Clean workspace
npx ts-node agent.ts "Clean all node_modules and build files"

# Test 4: Analyze project
npx ts-node agent.ts "Analyze this project and tell me about it"

# Test 5: Backup
npx ts-node agent.ts "Create a backup of this project"
```

---

## 🎯 Real-World Use Cases

### 1. Quick Project Setup
```
User: "Create a new Express API project called blog-api"
→ Full project structure in seconds
```

### 2. Feature Module Creation
```
User: "Add a new feature module for payments"
→ Scaffolds complete feature structure
```

### 3. Workspace Cleanup
```
User: "Clean up before committing"
→ Removes all temp files and artifacts
```

### 4. Project Documentation
```
User: "Analyze this project"
→ Complete overview of structure and dependencies
```

### 5. Safe Experimentation
```
User: "Backup the project before refactoring"
→ Creates timestamped backup
```

---

## 💡 Best Practices

### 1. Template Validation
```typescript
// Validate template exists before using
if (!TEMPLATES[template]) {
  return `Available templates: ${Object.keys(TEMPLATES).join(", ")}`;
}
```

### 2. Idempotent Operations
```typescript
// Check if project already exists
if (await fileExists(name)) {
  return `Error: Project '${name}' already exists`;
}
```

### 3. Atomic Operations
```typescript
// Use temp directory, then rename
const tempDir = `${name}.tmp`;
await createStructure(tempDir);
await fs.rename(tempDir, name);
```

### 4. Progress Feedback
```typescript
console.log(`📁 Creating directories...`);
console.log(`📄 Writing files...`);
console.log(`⚙️  Installing dependencies...`);
```

### 5. Rollback on Error
```typescript
try {
  await initProject(template, name);
} catch (error) {
  // Cleanup on failure
  await fs.rm(name, { recursive: true, force: true });
  throw error;
}
```

---

## 🔬 Advanced Features

### 1. Custom Templates
```typescript
// Allow user-defined templates
const customTemplates = await loadCustomTemplates("./.templates");
const allTemplates = { ...TEMPLATES, ...customTemplates };
```

### 2. Template Variables
```typescript
// Support placeholders in templates
const content = template
  .replace("{{name}}", projectName)
  .replace("{{author}}", author)
  .replace("{{year}}", new Date().getFullYear());
```

### 3. Interactive Mode
```typescript
// Ask for missing parameters
if (!name) {
  name = await promptUser("Project name:");
}
```

### 4. Git Integration
```typescript
// Auto-create first commit
await execAsync("git init");
await execAsync("git add .");
await execAsync('git commit -m "Initial commit"');
```

---

## 📊 Performance Considerations

### File Count Limits
```typescript
const MAX_FILES = 1000;
if (fileList.length > MAX_FILES) {
  return `Warning: Large project (${fileList.length} files)`;
}
```

### Concurrent Operations
```typescript
// Create files in parallel
await Promise.all(
  files.map(file => fs.writeFile(file.path, file.content))
);
```

### Progress Streaming
```typescript
// For large operations, stream progress
for (const file of files) {
  await createFile(file);
  console.log(`Progress: ${++count}/${total}`);
}
```

---

## 🎓 Key Takeaways

### 1. Orchestration Pattern
workspace_manager shows how to create **high-level tools** that orchestrate low-level primitives.

### 2. Template System
A good template system drastically accelerates new project setup.

### 3. Validation First
Always validate input and check conditions before modifying the filesystem.

### 4. Feedback is Key
Logging and progress updates make the user experience much better.

### 5. Error Recovery
Always implement rollback or cleanup in case of errors.

---

## 📚 Resources

- [Yeoman](https://yeoman.io/) - Inspiration for template system
- [Plop](https://plopjs.com/) - Micro-generator framework
- [Scaffolding Best Practices](https://github.com/carbon-design-system/carbon/blob/main/docs/guides/scaffolding.md)

---

**Remember**: workspace_manager is a **meta-tool** - its power comes from intelligently orchestrating other tools! 🗂️✨
