# 🚀 Migration Guide - From Monolith to Modules

This guide explains how to migrate a monolithic agent like yours towards a modular structure.

## Step-by-Step Migration

### Step 1: Create Directory Structure

```bash
mkdir -p tools/primitives tools/high-level
```

### Step 2: Create Types File

```typescript
// tools/types.ts
export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolImplementation {
  definition: Tool;
  execute: (input: any) => Promise<string>;
}
```

### Step 3: Extract One Tool at a Time

For each tool in the monolith:

1. **Identify the tool**
```typescript
// In the monolith you find:
const myTool: Tool = { ... };
async function executeMy(input) { ... }
```

2. **Create dedicated file**
```typescript
// tools/primitives/my-tool.ts
import { ToolImplementation } from "../types";

export const myTool: ToolImplementation = {
  definition: {
    name: "my_tool",
    description: "...",
    input_schema: { ... }
  },

  execute: async (input) => {
    // Copy the implementation here
    return "result";
  }
};
```

3. **Adjust imports**
```typescript
// If the tool uses fs, path, etc:
import * as fs from "fs/promises";
import * as path from "path";
```

### Step 4: Create Index File

```typescript
// tools/index.ts
export { tool1 } from "./primitives/tool1";
export { tool2 } from "./primitives/tool2";
// ... etc

export type { Tool, ToolImplementation } from "./types";
```

### Step 5: Refactor Agent.ts

**Before:**
```typescript
// Everything in the file
const tool1: Tool = { ... };
const tool2: Tool = { ... };

async function execute1(input) { ... }
async function execute2(input) { ... }

async function executeTool(name, input) {
  switch (name) {
    case "tool1": return execute1(input);
    case "tool2": return execute2(input);
  }
}

const tools = [tool1, tool2];
```

**After:**
```typescript
import { tool1, tool2 } from "./tools";

const TOOLS = [tool1, tool2];

const TOOL_MAP = new Map(
  TOOLS.map(t => [t.definition.name, t])
);

async function executeTool(name, input) {
  const tool = TOOL_MAP.get(name);
  return await tool.execute(input);
}
```

### Step 6: Test

```bash
# Test each tool individually
npx ts-node -e "
import { tool1 } from './tools';
console.log(await tool1.execute({ ... }));
"

# Test the complete agent
npx ts-node agent.ts "test command"
```

## Migration Checklist

- [ ] Directory structure created
- [ ] types.ts created
- [ ] Each tool extracted to separate file
- [ ] index.ts with all exports
- [ ] agent.ts refactored
- [ ] Import paths correct
- [ ] Tests pass
- [ ] Documentation updated

## Tool Migration Template

Use this template for each tool:

```typescript
import { ToolImplementation } from "../types";
// Other necessary imports (fs, path, exec, etc)

export const TOOL_NAME: ToolImplementation = {
  definition: {
    name: "tool_name",
    description: `
    Detailed description of the tool.

    USE CASES:
    - Use case 1
    - Use case 2
    `,
    input_schema: {
      type: "object",
      properties: {
        param1: {
          type: "string",
          description: "Parameter description"
        }
      },
      required: ["param1"]
    }
  },

  execute: async (input: { param1: string }) => {
    try {
      // Implementation
      return "success result";
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }
};
```

## Common Pitfalls

### 1. Circular Imports
❌ **Wrong:**
```typescript
// tools/tool1.ts
import { tool2 } from "./tool2";  // ← Avoid!
```

✅ **Correct:**
```typescript
// Tools should be independent
// If composition is needed, create a high-level tool
```

### 2. Shared State
❌ **Wrong:**
```typescript
// tools/tool1.ts
let sharedState = {};  // ← Avoid global state!
```

✅ **Correct:**
```typescript
// Pass state as parameter
execute: async (input: { state: any }) => { ... }
```

### 3. Relative Paths
❌ **Wrong:**
```typescript
import { myTool } from "../primitives/my-tool";  // From agent.ts
```

✅ **Correct:**
```typescript
import { myTool } from "./tools";  // Use index.ts
```

## Best Practices

### 1. Tool Size
- **Primitives**: 30-100 lines
- **High-level**: 200-700 lines
- If exceeds 700 lines, consider splitting

### 2. Naming
```
tools/
├── primitives/         ← Atomic operations
│   └── read-file.ts
└── high-level/         ← Orchestrations
    └── project-init.ts
```

### 3. Documentation
Every tool should have:
- Clear description
- Examples in the description
- Well-documented input schema

### 4. Error Handling
```typescript
execute: async (input) => {
  try {
    // Logic
    return successResult;
  } catch (error) {
    // ALWAYS catch and return string
    return `Error: ${(error as Error).message}`;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/tools/read-file.test.ts
import { readFileTool } from "../../tools/primitives/read-file";

describe("readFileTool", () => {
  it("reads file successfully", async () => {
    // Isolated tool test
  });
});
```

### Integration Tests
```typescript
// tests/agent.test.ts
import { agentLoop } from "../agent";

describe("Agent", () => {
  it("completes task with multiple tools", async () => {
    // Complete loop test
  });
});
```

## Complete Example

### Before (agent.ts - 1000+ lines)
```typescript
const readFile: Tool = { name: "read_file", ... };
const listFiles: Tool = { name: "list_files", ... };

async function readFileImpl(path: string) { ... }
async function listFilesImpl(path: string) { ... }

async function executeTool(name, input) {
  switch (name) {
    case "read_file": return readFileImpl(input.path);
    case "list_files": return listFilesImpl(input.path);
  }
}

// ... agent loop ...
```

### After (agent.ts - ~150 lines)
```typescript
import { readFileTool, listFilesTool } from "./tools";

const TOOLS = [readFileTool, listFilesTool];
const TOOL_MAP = new Map(TOOLS.map(t => [t.definition.name, t]));

async function executeTool(name, input) {
  return await TOOL_MAP.get(name)?.execute(input);
}

// ... agent loop ...
```

### Tool File (tools/primitives/read-file.ts - ~30 lines)
```typescript
import * as fs from "fs/promises";
import { ToolImplementation } from "../types";

export const readFileTool: ToolImplementation = {
  definition: {
    name: "read_file",
    description: "Read file contents",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" }
      },
      required: ["path"]
    }
  },

  execute: async (input: { path: string }) => {
    try {
      return await fs.readFile(input.path, "utf-8");
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }
};
```

## Typical Timeline

For an agent with 5-10 tools:
- **Setup directory**: 5 minutes
- **Create types.ts**: 5 minutes
- **Migrate one tool**: 15-20 minutes
- **Create index.ts**: 10 minutes
- **Refactor agent.ts**: 30 minutes
- **Testing**: 30 minutes

**Total: 2-3 hours** for a complete migration

## Resources

- [REFACTORING.md](./REFACTORING.md) - Refactoring details
- [COMPARISON.md](./COMPARISON.md) - Before vs After
- [tools/](./tools/) - Reference code

## Frequently Asked Questions

### Q: Do I have to migrate all tools at once?
**A**: No! Migrate one at a time. You can have both the old and new versions temporarily.

### Q: How do I handle tools that depend on each other?
**A**: Create high-level tools that orchestrate the primitives.

### Q: What do I do with shared helper functions?
**A**: Put them in `tools/utils.ts` or in the tool that mainly uses them.

### Q: Can I use this pattern for other agent frameworks?
**A**: Yes! The pattern is framework-agnostic.

---

Happy migrating! 🚀
