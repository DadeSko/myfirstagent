# 📁 Filesystem Operations - Deep Dive

Complete guide on how agents interact with the file system in a safe and professional manner.

---

## 🎯 What Are Filesystem Operations?

Filesystem operations are the **fundamental primitives** that allow the agent to:
- 📖 **Read** files and directories
- ✏️ **Write** and modify files
- 📁 **Navigate** the project structure
- 🗑️ **Delete** files (with caution!)
- 🔍 **Search** contents

**Without filesystem operations, a coding agent is blind and mute!**

---

## 📚 The Node.js fs Promises API

### Why Promises Instead of Callbacks?

```typescript
// ❌ OLD WAY - Callbacks (callback hell)
fs.readFile("file.txt", (err, data) => {
  if (err) throw err;
  fs.writeFile("output.txt", data, (err) => {
    if (err) throw err;
    console.log("Done!");
  });
});

// ✅ NEW WAY - Promises (clean & async/await)
import * as fs from "fs/promises";

try {
  const data = await fs.readFile("file.txt", "utf-8");
  await fs.writeFile("output.txt", data);
  console.log("Done!");
} catch (err) {
  console.error(err);
}
```

**In our agent we use**: `import * as fs from "fs/promises"`

---

## 🔧 Operation 1: READ (Reading Files)

### Base API: fs.readFile()

```typescript
import * as fs from "fs/promises";

async function readFile(filePath: string): Promise<string> {
  try {
    // Signature: readFile(path, encoding)
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

### Encoding Options

```typescript
// UTF-8 (normal text)
const text = await fs.readFile("file.txt", "utf-8");

// Buffer (binary files)
const buffer = await fs.readFile("image.png");

// ASCII
const ascii = await fs.readFile("file.txt", "ascii");

// Base64
const base64 = await fs.readFile("file.txt", "base64");
```

### Real-World Example

```typescript
async function readFile(filePath: string): Promise<string> {
  try {
    // Check if file exists first
    await fs.access(filePath);

    const content = await fs.readFile(filePath, "utf-8");

    // Log useful info
    console.log(`✓ Read file: ${filePath} (${content.length} bytes)`);

    return content;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    // Specific error messages
    if (err.code === "ENOENT") {
      return `Error: File '${filePath}' does not exist`;
    } else if (err.code === "EACCES") {
      return `Error: Permission denied to read '${filePath}'`;
    } else if (err.code === "EISDIR") {
      return `Error: '${filePath}' is a directory, not a file`;
    }

    return `Error reading file: ${err.message}`;
  }
}
```

### Common Error Codes

| Code | Meaning | What to Do |
|------|---------|------------|
| `ENOENT` | File doesn't exist | Suggest creating the file |
| `EACCES` | Permission denied | Suggest chmod or sudo |
| `EISDIR` | It's a directory | Use readdir instead |
| `EMFILE` | Too many open files | Close open files |

---

## 📝 Operation 2: WRITE (Writing Files)

### Base API: fs.writeFile()

```typescript
async function writeFile(
  filePath: string,
  content: string
): Promise<string> {
  try {
    // Signature: writeFile(path, data, encoding)
    await fs.writeFile(filePath, content, "utf-8");

    console.log(`✓ Wrote file: ${filePath} (${content.length} bytes)`);
    return `Successfully wrote ${filePath}`;
  } catch (error) {
    return `Error writing file: ${(error as Error).message}`;
  }
}
```

### Write vs Append

```typescript
// WRITE - Overwrites the entire file
await fs.writeFile("log.txt", "New content");
// File now contains: "New content"

// APPEND - Adds to the end
await fs.appendFile("log.txt", "\nMore content");
// File now contains: "New content\nMore content"
```

### Example: Edit File Tool

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  try {
    if (oldStr === "") {
      // CREATE NEW FILE
      await fs.writeFile(filePath, newStr, "utf-8");
      console.log(`✓ Created: ${filePath} (${newStr.length} bytes)`);
      return `Successfully created file ${filePath}`;

    } else {
      // MODIFY EXISTING FILE

      // 1. Read current content
      const content = await fs.readFile(filePath, "utf-8");

      // 2. Validate that oldStr exists
      if (!content.includes(oldStr)) {
        return `Error: Could not find "${oldStr.substring(0, 50)}..." in ${filePath}`;
      }

      // 3. Replace
      const newContent = content.replace(oldStr, newStr);

      // 4. Write new content
      await fs.writeFile(filePath, newContent, "utf-8");

      console.log(`✓ Edited: ${filePath}`);
      return `Successfully edited file ${filePath}`;
    }
  } catch (error) {
    return `Error editing file: ${(error as Error).message}`;
  }
}
```

### Atomic Writes (Advanced)

```typescript
// ❌ NON-ATOMIC - If it crashes midway, file corrupted!
await fs.writeFile("important.json", JSON.stringify(data));

// ✅ ATOMIC - Write to temp, then rename (atomic on Unix)
import * as path from "path";

async function writeFileAtomic(
  filePath: string,
  content: string
): Promise<void> {
  const tempPath = `${filePath}.tmp`;

  try {
    // 1. Write to temporary file
    await fs.writeFile(tempPath, content, "utf-8");

    // 2. Rename (atomic!)
    await fs.rename(tempPath, filePath);

  } catch (error) {
    // Cleanup temp file if it fails
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

---

## 📁 Operation 3: LIST (Listing Directories)

### Base API: fs.readdir()

```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  try {
    // readdir returns array of names
    const files = await fs.readdir(dirPath);

    return files.join("\n");
  } catch (error) {
    return `Error listing directory: ${(error as Error).message}`;
  }
}
```

### With FileType Info (Better!)

```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  try {
    // withFileTypes: true → returns Dirent objects
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    const fileList = files.map((file) => {
      // Dirent has methods: isFile(), isDirectory(), isSymbolicLink()
      const prefix = file.isDirectory() ? "📁" : "📄";
      return `${prefix} ${file.name}`;
    });

    console.log(`✓ Listed ${files.length} items in ${dirPath}`);
    return fileList.join("\n");

  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === "ENOENT") {
      return `Error: Directory '${dirPath}' does not exist`;
    } else if (err.code === "ENOTDIR") {
      return `Error: '${dirPath}' is not a directory`;
    }

    return `Error listing files: ${err.message}`;
  }
}
```

### Recursive Listing (Advanced)

```typescript
async function listFilesRecursive(
  dirPath: string = ".",
  prefix: string = ""
): Promise<string[]> {
  const result: string[] = [];

  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      const icon = file.isDirectory() ? "📁" : "📄";

      result.push(`${prefix}${icon} ${file.name}`);

      // Recursion for subdirectories
      if (file.isDirectory()) {
        const subFiles = await listFilesRecursive(
          fullPath,
          prefix + "  "
        );
        result.push(...subFiles);
      }
    }
  } catch (error) {
    result.push(`${prefix}❌ Error: ${(error as Error).message}`);
  }

  return result;
}

// Usage:
const tree = await listFilesRecursive("./src");
console.log(tree.join("\n"));
```

Output:
```
📁 src
  📄 agent.ts
  📁 tools
    📄 read.ts
    📄 write.ts
  📄 index.ts
```

---

## 🔍 Operation 4: STAT (File Info)

### API: fs.stat()

```typescript
async function getFileInfo(filePath: string): Promise<string> {
  try {
    const stats = await fs.stat(filePath);

    return `
File: ${filePath}
Size: ${stats.size} bytes
Created: ${stats.birthtime}
Modified: ${stats.mtime}
Is File: ${stats.isFile()}
Is Directory: ${stats.isDirectory()}
Permissions: ${stats.mode.toString(8)}
    `.trim();

  } catch (error) {
    return `Error getting file info: ${(error as Error).message}`;
  }
}
```

### Stats Object Properties

```typescript
interface Stats {
  size: number;              // Size in bytes
  birthtime: Date;          // Creation date
  mtime: Date;              // Last modification date
  atime: Date;              // Last access date
  mode: number;             // Permissions (Unix)

  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
}
```

### Check Existence

```typescript
// ✅ CORRECT WAY - fs.access()
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ❌ AVOID - fs.stat() is slower
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
```

---

## 🗑️ Operation 5: DELETE (Deleting Files)

### API: fs.unlink() for files, fs.rm() for directories

```typescript
// DELETE FILE
async function deleteFile(filePath: string): Promise<string> {
  try {
    await fs.unlink(filePath);
    console.log(`✓ Deleted file: ${filePath}`);
    return `Successfully deleted ${filePath}`;
  } catch (error) {
    return `Error deleting file: ${(error as Error).message}`;
  }
}

// DELETE DIRECTORY (recursive)
async function deleteDirectory(dirPath: string): Promise<string> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    console.log(`✓ Deleted directory: ${dirPath}`);
    return `Successfully deleted ${dirPath}`;
  } catch (error) {
    return `Error deleting directory: ${(error as Error).message}`;
  }
}
```

### Safe Delete (with confirmation)

```typescript
async function safeDelete(filePath: string): Promise<string> {
  try {
    // 1. Check if exists
    const exists = await fileExists(filePath);
    if (!exists) {
      return `Error: ${filePath} does not exist`;
    }

    // 2. Get info
    const stats = await fs.stat(filePath);

    // 3. Backup before deleting? (optional)
    if (stats.size > 1024 * 1024) {  // > 1MB
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
      console.log(`📦 Created backup: ${backupPath}`);
    }

    // 4. Delete
    await fs.unlink(filePath);
    console.log(`✓ Deleted: ${filePath}`);
    return `Successfully deleted ${filePath}`;

  } catch (error) {
    return `Error deleting file: ${(error as Error).message}`;
  }
}
```

---

## 📂 Operation 6: MKDIR (Creating Directories)

### API: fs.mkdir()

```typescript
async function createDirectory(dirPath: string): Promise<string> {
  try {
    // recursive: true → also creates parent directories
    await fs.mkdir(dirPath, { recursive: true });

    console.log(`✓ Created directory: ${dirPath}`);
    return `Successfully created ${dirPath}`;

  } catch (error) {
    return `Error creating directory: ${(error as Error).message}`;
  }
}
```

### Example: mkdir with validation

```typescript
async function createDirectory(dirPath: string): Promise<string> {
  // Validation
  if (!dirPath || dirPath.trim() === "") {
    return "Error: Directory path cannot be empty";
  }

  try {
    // Check if already exists
    const exists = await fileExists(dirPath);
    if (exists) {
      const stats = await fs.stat(dirPath);
      if (stats.isDirectory()) {
        return `Directory ${dirPath} already exists`;
      } else {
        return `Error: ${dirPath} exists but is not a directory`;
      }
    }

    // Create directory
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
    return `Successfully created directory ${dirPath}`;

  } catch (error) {
    return `Error creating directory: ${(error as Error).message}`;
  }
}
```

---

## 🔄 Operation 7: COPY & MOVE

### Copy File

```typescript
async function copyFile(
  source: string,
  dest: string
): Promise<string> {
  try {
    await fs.copyFile(source, dest);
    console.log(`✓ Copied: ${source} → ${dest}`);
    return `Successfully copied ${source} to ${dest}`;
  } catch (error) {
    return `Error copying file: ${(error as Error).message}`;
  }
}
```

### Copy Directory (Recursive)

```typescript
async function copyDirectory(
  source: string,
  dest: string
): Promise<string> {
  try {
    // Create destination directory
    await fs.mkdir(dest, { recursive: true });

    // Read all files
    const files = await fs.readdir(source, { withFileTypes: true });

    // Copy recursively
    for (const file of files) {
      const srcPath = path.join(source, file.name);
      const destPath = path.join(dest, file.name);

      if (file.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }

    console.log(`✓ Copied directory: ${source} → ${dest}`);
    return `Successfully copied ${source} to ${dest}`;

  } catch (error) {
    return `Error copying directory: ${(error as Error).message}`;
  }
}
```

### Move (Rename)

```typescript
async function moveFile(
  source: string,
  dest: string
): Promise<string> {
  try {
    // fs.rename works for move
    await fs.rename(source, dest);
    console.log(`✓ Moved: ${source} → ${dest}`);
    return `Successfully moved ${source} to ${dest}`;
  } catch (error) {
    return `Error moving file: ${(error as Error).message}`;
  }
}
```

---

## 🔐 Operation 8: PERMISSIONS (Advanced)

### Chmod (Change Mode)

```typescript
async function changePermissions(
  filePath: string,
  mode: string
): Promise<string> {
  try {
    // Mode in octal: "755", "644", etc
    await fs.chmod(filePath, parseInt(mode, 8));
    console.log(`✓ Changed permissions: ${filePath} → ${mode}`);
    return `Successfully changed permissions of ${filePath}`;
  } catch (error) {
    return `Error changing permissions: ${(error as Error).message}`;
  }
}
```

### Example: Make Executable

```typescript
async function makeExecutable(filePath: string): Promise<string> {
  try {
    // 0o755 = rwxr-xr-x
    await fs.chmod(filePath, 0o755);
    console.log(`✓ Made executable: ${filePath}`);
    return `Successfully made ${filePath} executable`;
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

---

## 🛡️ Best Practices for Filesystem Operations

### 1. Always Use Path.join()

```typescript
// ❌ BAD - Problems on Windows vs Unix
const filePath = dirPath + "/" + fileName;

// ✅ GOOD - Cross-platform
import * as path from "path";
const filePath = path.join(dirPath, fileName);
```

### 2. Normalize Paths

```typescript
import * as path from "path";

// User input: "../../../etc/passwd" (path traversal attack!)
const userPath = "../../../etc/passwd";

// ✅ Normalize and validate
const safePath = path.normalize(userPath);
const absolutePath = path.resolve(safePath);

// Check that it's inside the working directory
const cwd = process.cwd();
if (!absolutePath.startsWith(cwd)) {
  throw new Error("Path traversal detected!");
}
```

### 3. Check Before Operations

```typescript
async function readFile(filePath: string): Promise<string> {
  try {
    // 1. Check access
    await fs.access(filePath, fs.constants.R_OK);

    // 2. Check that it's a file
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return `Error: ${filePath} is not a file`;
    }

    // 3. Check size (avoid giant files)
    if (stats.size > 10 * 1024 * 1024) {  // 10MB
      return `Error: File too large (${stats.size} bytes)`;
    }

    // 4. Read
    const content = await fs.readFile(filePath, "utf-8");
    return content;

  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

### 4. Use Streams for Large Files

```typescript
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";

async function copyLargeFile(source: string, dest: string): Promise<void> {
  // Stream is memory-efficient for large files
  await pipeline(
    createReadStream(source),
    createWriteStream(dest)
  );
}
```

---

## 🎯 Complete Filesystem Tool Example

```typescript
import * as fs from "fs/promises";
import * as path from "path";

const fileSystemTool: Tool = {
  name: "file_system",
  description: `Perform filesystem operations: read, write, list, delete, copy, move files and directories.`,
  input_schema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["read", "write", "list", "delete", "copy", "move", "mkdir", "stat"],
        description: "The filesystem operation to perform"
      },
      path: {
        type: "string",
        description: "Primary file/directory path"
      },
      content: {
        type: "string",
        description: "Content for write operation"
      },
      dest: {
        type: "string",
        description: "Destination path for copy/move operations"
      }
    },
    required: ["operation", "path"]
  }
};

async function fileSystem(
  operation: string,
  filePath: string,
  content?: string,
  dest?: string
): Promise<string> {
  // Normalize path
  const safePath = path.normalize(filePath);

  // Security check
  const cwd = process.cwd();
  const absolutePath = path.resolve(safePath);
  if (!absolutePath.startsWith(cwd)) {
    return "Error: Path outside working directory";
  }

  try {
    switch (operation) {
      case "read":
        return await fs.readFile(safePath, "utf-8");

      case "write":
        if (!content) return "Error: content required for write";
        await fs.writeFile(safePath, content, "utf-8");
        return `Wrote ${content.length} bytes to ${safePath}`;

      case "list":
        const files = await fs.readdir(safePath, { withFileTypes: true });
        return files.map(f =>
          `${f.isDirectory() ? "📁" : "📄"} ${f.name}`
        ).join("\n");

      case "delete":
        const stats = await fs.stat(safePath);
        if (stats.isDirectory()) {
          await fs.rm(safePath, { recursive: true });
        } else {
          await fs.unlink(safePath);
        }
        return `Deleted ${safePath}`;

      case "copy":
        if (!dest) return "Error: dest required for copy";
        await fs.copyFile(safePath, dest);
        return `Copied ${safePath} to ${dest}`;

      case "move":
        if (!dest) return "Error: dest required for move";
        await fs.rename(safePath, dest);
        return `Moved ${safePath} to ${dest}`;

      case "mkdir":
        await fs.mkdir(safePath, { recursive: true });
        return `Created directory ${safePath}`;

      case "stat":
        const stat = await fs.stat(safePath);
        return `Size: ${stat.size} bytes, Modified: ${stat.mtime}`;

      default:
        return `Unknown operation: ${operation}`;
    }
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

---

## 🧪 Testing Filesystem Operations

```bash
# Test 1: Read
npx ts-node agent.ts "Read package.json"

# Test 2: Write
npx ts-node agent.ts "Create test.txt with 'hello world'"

# Test 3: List
npx ts-node agent.ts "List all files in the current directory"

# Test 4: Stat
npx ts-node agent.ts "Give me info on agent.ts"

# Test 5: Copy
npx ts-node agent.ts "Copy agent.ts to agent.backup.ts"

# Test 6: Move
npx ts-node agent.ts "Rename test.txt to test-renamed.txt"

# Test 7: Delete
npx ts-node agent.ts "Delete test-renamed.txt"

# Test 8: Mkdir
npx ts-node agent.ts "Create directory tmp/test/deep"
```

---

## 📊 Filesystem API Quick Reference

| Operation | API | Use |
|-----------|-----|-----|
| Read file | `fs.readFile(path, encoding)` | Read content |
| Write file | `fs.writeFile(path, data)` | Write/overwrite |
| Append | `fs.appendFile(path, data)` | Add to end of file |
| List dir | `fs.readdir(path, options)` | List contents |
| File info | `fs.stat(path)` | Get metadata |
| Check exist | `fs.access(path)` | Verify existence |
| Delete file | `fs.unlink(path)` | Delete file |
| Delete dir | `fs.rm(path, {recursive})` | Delete directory |
| Copy | `fs.copyFile(src, dest)` | Copy file |
| Move/Rename | `fs.rename(old, new)` | Move/rename |
| Make dir | `fs.mkdir(path, {recursive})` | Create directory |
| Change perms | `fs.chmod(path, mode)` | Modify permissions |

---

## 💡 Pro Tips

1. **Use path.join()**: Always for cross-platform compatibility
2. **Validate paths**: Prevent path traversal attacks
3. **Check before operations**: access, stat, size checks
4. **Handle all errors**: ENOENT, EACCES, EISDIR, etc
5. **Log operations**: Helps debugging
6. **Use streams**: For files > 10MB
7. **Atomic operations**: Write to temp, then rename
8. **Backup critical files**: Before delete/overwrite

---

## 🎓 Practical Exercise

Implement a complete `workspace_manager` tool:

```typescript
// Features to implement:
// 1. Create project structure
// 2. Safe file operations with backup
// 3. Search files by pattern
// 4. Clean up temp files
// 5. Validate all paths

const workspaceManagerTool: Tool = {
  name: "workspace_manager",
  // Your implementation here!
};
```

---

**Remember**: The file system is the foundation of every coding agent. Mastering these operations allows you to build agents that can truly manipulate projects! 📁✨
