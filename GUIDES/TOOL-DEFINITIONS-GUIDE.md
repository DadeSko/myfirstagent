# 🔧 Tool Definition Structure - Deep Dive

In-depth guide on how tool definitions work in agents.

---

## 🎯 What is a Tool Definition?

A tool definition is a **contract** between your agent and Claude. It consists of three parts:

```typescript
interface Tool {
  name: string;              // 1. Tool name
  description: string;       // 2. "Billboard" for Claude
  input_schema: {            // 3. Parameter schema
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
```

Think of this as a **job posting**:
- **Name**: The job title ("Software Engineer")
- **Description**: The role description and responsibilities
- **Input Schema**: The required qualifications/requirements

---

## 📋 Part 1: Name

### Rules for Names

```typescript
// ✅ GOOD
name: "read_file"
name: "list_files"
name: "bash"
name: "edit_file"

// ❌ BAD
name: "readFile"        // Avoid camelCase
name: "read-file"       // Avoid hyphens (use underscores)
name: "File Reader"     // Avoid spaces
name: "r"              // Too short, not descriptive
```

### Best Practices

1. **Snake case**: Use `underscore_case`
2. **Descriptive**: The name should say what it does
3. **Short but clear**: 1-3 words
4. **Verb + Noun**: `read_file`, `list_files`, `execute_bash`

### Examples from Our Agent

```typescript
const readFileTool: Tool = {
  name: "read_file",      // Clear: reads a file
  // ...
};

const bashTool: Tool = {
  name: "bash",           // Succinct: executes bash
  // ...
};
```

---

## 💬 Part 2: Description (The Billboard)

### Why is it Important?

The description is a **"billboard"** that nudges Claude's **latent space**.

**Geoffrey's Insight**:
> "It's just a function with a billboard on top that nudges the LLM's latent space to invoke that function."

### Anatomy of a Good Description

```typescript
description: `
  [WHAT the tool does]
  [WHEN to use it]
  [WHEN NOT to use it - optional]
  [TECHNICAL DETAILS - optional]
`
```

### Example: read_file

```typescript
// ❌ BAD - Too generic
description: "Reads files"

// ✅ GOOD - Complete and guiding
description: `Read the contents of a given relative file path.
Use this when you want to see what's inside a file.
Do not use this with directory names.`
```

**Breakdown**:
1. ✅ **What it does**: "Read the contents..."
2. ✅ **When to use**: "Use this when you want to see..."
3. ✅ **When NOT to use**: "Do not use this with directory names"

### Example: bash

```typescript
// ❌ BAD
description: "Runs commands"

// ✅ GOOD
description: "Execute a bash command and return its output. Use this to run shell commands."
```

### Example: edit_file

```typescript
// ✅ EXCELLENT - Very detailed
description: `Edit a file by replacing old_str with new_str.
If old_str is empty, creates a new file with new_str as content.`
```

**Note**: It also explains the special case (creating a new file)!

### Pro Tips for Descriptions

```typescript
// 1. Be specific about output format
description: `List files and directories at a given path.
Returns files with 📄 prefix and directories with 📁 prefix.
If no path is provided, lists files in the current directory.`

// 2. Include examples if it helps
description: `Search for code patterns using ripgrep.
Example: search for "function" in all .ts files.
Use this to find code patterns, function definitions, or variable usage.`

// 3. Mention limitations
description: `Execute a bash command and return its output.
Note: Commands with interactive prompts may hang.
Use for non-interactive commands only.`
```

---

## 🎨 Part 3: Input Schema

The input schema describes **which parameters** the tool accepts and **how they are structured**.

### Basic Structure

```typescript
input_schema: {
  type: "object",           // Always "object"
  properties: {
    param_name: {
      type: "string",       // Parameter type
      description: "..."    // What it represents
    }
  },
  required: ["param_name"]  // Required parameters
}
```

### Parameter Types

```typescript
// STRING
properties: {
  path: {
    type: "string",
    description: "The relative path to the file"
  }
}

// NUMBER
properties: {
  max_results: {
    type: "number",
    description: "Maximum number of results to return"
  }
}

// BOOLEAN
properties: {
  recursive: {
    type: "boolean",
    description: "Whether to search recursively"
  }
}

// ARRAY
properties: {
  file_types: {
    type: "array",
    items: { type: "string" },
    description: "File extensions to include (e.g., ['ts', 'js'])"
  }
}

// OBJECT
properties: {
  options: {
    type: "object",
    properties: {
      case_sensitive: { type: "boolean" },
      max_depth: { type: "number" }
    }
  }
}
```

### Complete Example: read_file

```typescript
const readFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The relative path to the file to read"
      }
    },
    required: ["path"]  // path is required
  }
};
```

**What happens when Claude uses this tool**:
```json
{
  "name": "read_file",
  "input": {
    "path": "agent.ts"
  }
}
```

### Complete Example: bash

```typescript
const bashTool: Tool = {
  name: "bash",
  description: "Execute a bash command and return its output. Use this to run shell commands.",
  input_schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The bash command to execute"
      }
    },
    required: ["command"]
  }
};
```

**Claude calls it like this**:
```json
{
  "name": "bash",
  "input": {
    "command": "ls -la"
  }
}
```

### Complete Example: edit_file

```typescript
const editFileTool: Tool = {
  name: "edit_file",
  description: "Edit a file by replacing old_str with new_str. If old_str is empty, creates a new file with new_str as content.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to edit"
      },
      old_str: {
        type: "string",
        description: "The string to replace (empty for new file)"
      },
      new_str: {
        type: "string",
        description: "The new content to insert"
      }
    },
    required: ["path", "old_str", "new_str"]  // All required!
  }
};
```

**Claude calls it like this**:
```json
// Create new file
{
  "name": "edit_file",
  "input": {
    "path": "test.txt",
    "old_str": "",
    "new_str": "Hello World!"
  }
}

// Modify existing file
{
  "name": "edit_file",
  "input": {
    "path": "test.txt",
    "old_str": "Hello World!",
    "new_str": "Hello Agent!"
  }
}
```

---

## 🎭 Optional vs Required Parameters

### Example: list_files

```typescript
const listFilesTool: Tool = {
  name: "list_files",
  description: "List files and directories at a given path. If no path is provided, lists files in the current directory.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The directory path to list (defaults to current directory)"
      }
    }
    // ⚠️ NOTE: "required" is absent!
    // This means "path" is OPTIONAL
  }
};
```

**Implementation must handle the optional case**:
```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  // ⬆️ Default value "." if not provided
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  // ...
}
```

**Claude can call it in two ways**:
```json
// With path
{
  "name": "list_files",
  "input": {
    "path": "./src"
  }
}

// Without path (uses default)
{
  "name": "list_files",
  "input": {}
}
```

---

## 🔬 Advanced: Enum and Constraints

### Enum (Limited Values)

```typescript
const searchTool: Tool = {
  name: "code_search",
  description: "Search code with specific file type filter",
  input_schema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "The search pattern"
      },
      file_type: {
        type: "string",
        enum: ["ts", "js", "tsx", "jsx", "all"],
        description: "File type to search in"
      }
    },
    required: ["pattern"]
  }
};
```

Claude can only use one of the enum values!

### Constraints (Numbers)

```typescript
properties: {
  max_results: {
    type: "number",
    minimum: 1,
    maximum: 100,
    description: "Number of results (1-100)"
  }
}
```

---

## 💡 How Does Claude Decide Which Tool to Use?

### The Decision Making Process

```
User: "List all TypeScript files"
         ↓
Claude analyzes the query
         ↓
Claude looks at ALL tool descriptions
         ↓
Claude sees: "list_files" - "List files and directories..."
         ↓
"This tool is perfect!"
         ↓
Claude calls: list_files({ path: "." })
```

### Real-World Example

**User**: "Create fizzbuzz.ts and run it"

**Claude's Thought Process** (hypothetical):
```
Step 1: "Create fizzbuzz.ts"
  → Looking at tools...
  → "edit_file" has "creates a new file" in the description
  → Using edit_file!

Step 2: "run it"
  → Need to execute a TypeScript file
  → "bash" can "execute commands"
  → Using bash with "ts-node fizzbuzz.ts"!
```

---

## 🎯 Summary Best Practices

### 1. Name
✅ Snake case, descriptive, verb+noun

### 2. Description
✅ Explain what it does
✅ When to use it
✅ When NOT to use it
✅ Special cases

### 3. Input Schema
✅ Precise type
✅ Clear description for each parameter
✅ Required only for truly necessary parameters
✅ Default values in implementation for optional parameters

---

## 📊 Template for Creating New Tools

```typescript
const myNewTool: Tool = {
  // 1. Name: snake_case, verb+noun
  name: "my_action",

  // 2. Description: what, when, details
  description: `
    [Primary action description]
    [When to use this tool]
    [Special cases or limitations]
  `,

  // 3. Schema: define parameters
  input_schema: {
    type: "object",
    properties: {
      required_param: {
        type: "string",
        description: "Clear description of this parameter"
      },
      optional_param: {
        type: "string",
        description: "This one is optional"
      }
    },
    required: ["required_param"]  // Only required parameters
  }
};
```

---

## 🧪 Practical Exercise

Try creating the definition for a `create_directory` tool:

```typescript
const createDirectoryTool: Tool = {
  name: "create_directory",
  description: `Create a new directory at the specified path.
  Use this when you need to create a folder structure.
  Will create parent directories if they don't exist.`,
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path where to create the directory"
      },
      recursive: {
        type: "boolean",
        description: "Whether to create parent directories (default: true)"
      }
    },
    required: ["path"]
  }
};
```

Then implement the function:
```typescript
async function createDirectory(
  dirPath: string,
  recursive: boolean = true
): Promise<string> {
  // Your implementation here!
}
```

---

**Remember**: Tool definitions are the **language** you use to talk to Claude. The clearer they are, the better Claude understands what to use and when! 🎯
