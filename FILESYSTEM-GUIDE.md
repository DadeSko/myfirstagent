# 📁 Filesystem Operations - Deep Dive

Guida completa su come gli agent interagiscono con il file system in modo sicuro e professionale.

---

## 🎯 Cosa Sono le Filesystem Operations?

Le filesystem operations sono le **primitive fondamentali** che permettono all'agent di:
- 📖 **Leggere** file e directory
- ✏️ **Scrivere** e modificare file
- 📁 **Navigare** la struttura del progetto
- 🗑️ **Eliminare** file (con cautela!)
- 🔍 **Cercare** contenuti

**Senza filesystem operations, un coding agent è cieco e muto!**

---

## 📚 Le Node.js fs Promises API

### Perché Promises invece di Callbacks?

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

**Nel nostro agent usiamo**: `import * as fs from "fs/promises"`

---

## 🔧 Operazione 1: READ (Leggere File)

### API Base: fs.readFile()

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
// UTF-8 (testo normale)
const text = await fs.readFile("file.txt", "utf-8");

// Buffer (file binari)
const buffer = await fs.readFile("image.png");

// ASCII
const ascii = await fs.readFile("file.txt", "ascii");

// Base64
const base64 = await fs.readFile("file.txt", "base64");
```

### Esempio Real-World

```typescript
async function readFile(filePath: string): Promise<string> {
  try {
    // Check se file esiste prima
    await fs.access(filePath);
    
    const content = await fs.readFile(filePath, "utf-8");
    
    // Log info utili
    console.log(`✓ Read file: ${filePath} (${content.length} bytes)`);
    
    return content;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    
    // Error messages specifici
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

| Code | Significato | Cosa Fare |
|------|-------------|-----------|
| `ENOENT` | File non esiste | Suggerisci di creare il file |
| `EACCES` | Permission denied | Suggerisci chmod o sudo |
| `EISDIR` | È una directory | Usa readdir invece |
| `EMFILE` | Too many open files | Chiudi file aperti |

---

## 📝 Operazione 2: WRITE (Scrivere File)

### API Base: fs.writeFile()

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
// WRITE - Sovrascrive tutto il file
await fs.writeFile("log.txt", "New content");
// File ora contiene: "New content"

// APPEND - Aggiunge alla fine
await fs.appendFile("log.txt", "\nMore content");
// File ora contiene: "New content\nMore content"
```

### Esempio: Edit File Tool

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  try {
    if (oldStr === "") {
      // CREA NUOVO FILE
      await fs.writeFile(filePath, newStr, "utf-8");
      console.log(`✓ Created: ${filePath} (${newStr.length} bytes)`);
      return `Successfully created file ${filePath}`;
      
    } else {
      // MODIFICA FILE ESISTENTE
      
      // 1. Leggi contenuto attuale
      const content = await fs.readFile(filePath, "utf-8");
      
      // 2. Valida che oldStr esista
      if (!content.includes(oldStr)) {
        return `Error: Could not find "${oldStr.substring(0, 50)}..." in ${filePath}`;
      }
      
      // 3. Replace
      const newContent = content.replace(oldStr, newStr);
      
      // 4. Scrivi nuovo contenuto
      await fs.writeFile(filePath, newContent, "utf-8");
      
      console.log(`✓ Edited: ${filePath}`);
      return `Successfully edited file ${filePath}`;
    }
  } catch (error) {
    return `Error editing file: ${(error as Error).message}`;
  }
}
```

### Atomic Writes (Avanzato)

```typescript
// ❌ NON-ATOMIC - Se crasha a metà, file corrotto!
await fs.writeFile("important.json", JSON.stringify(data));

// ✅ ATOMIC - Scrive in temp, poi rename (atomico in Unix)
import * as path from "path";

async function writeFileAtomic(
  filePath: string, 
  content: string
): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  
  try {
    // 1. Scrivi in file temporaneo
    await fs.writeFile(tempPath, content, "utf-8");
    
    // 2. Rename (atomico!)
    await fs.rename(tempPath, filePath);
    
  } catch (error) {
    // Cleanup temp file se fallisce
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

---

## 📁 Operazione 3: LIST (Elencare Directory)

### API Base: fs.readdir()

```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  try {
    // readdir restituisce array di nomi
    const files = await fs.readdir(dirPath);
    
    return files.join("\n");
  } catch (error) {
    return `Error listing directory: ${(error as Error).message}`;
  }
}
```

### Con FileType Info (Meglio!)

```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  try {
    // withFileTypes: true → restituisce Dirent objects
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    const fileList = files.map((file) => {
      // Dirent ha metodi: isFile(), isDirectory(), isSymbolicLink()
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

### Recursive Listing (Avanzato)

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
      
      // Ricorsione per subdirectories
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

// Uso:
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

## 🔍 Operazione 4: STAT (Info su File)

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
  size: number;              // Dimensione in bytes
  birthtime: Date;          // Data creazione
  mtime: Date;              // Data ultima modifica
  atime: Date;              // Data ultimo accesso
  mode: number;             // Permessi (Unix)
  
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
// ✅ MODO CORRETTO - fs.access()
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ❌ EVITA - fs.stat() è più lento
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

## 🗑️ Operazione 5: DELETE (Eliminare File)

### API: fs.unlink() per file, fs.rm() per directories

```typescript
// ELIMINA FILE
async function deleteFile(filePath: string): Promise<string> {
  try {
    await fs.unlink(filePath);
    console.log(`✓ Deleted file: ${filePath}`);
    return `Successfully deleted ${filePath}`;
  } catch (error) {
    return `Error deleting file: ${(error as Error).message}`;
  }
}

// ELIMINA DIRECTORY (recursive)
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

### Safe Delete (con conferma)

```typescript
async function safeDelete(filePath: string): Promise<string> {
  try {
    // 1. Check se esiste
    const exists = await fileExists(filePath);
    if (!exists) {
      return `Error: ${filePath} does not exist`;
    }
    
    // 2. Get info
    const stats = await fs.stat(filePath);
    
    // 3. Backup prima di eliminare? (opzionale)
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

## 📂 Operazione 6: MKDIR (Creare Directory)

### API: fs.mkdir()

```typescript
async function createDirectory(dirPath: string): Promise<string> {
  try {
    // recursive: true → crea anche parent directories
    await fs.mkdir(dirPath, { recursive: true });
    
    console.log(`✓ Created directory: ${dirPath}`);
    return `Successfully created ${dirPath}`;
    
  } catch (error) {
    return `Error creating directory: ${(error as Error).message}`;
  }
}
```

### Esempio: mkdir con validazione

```typescript
async function createDirectory(dirPath: string): Promise<string> {
  // Validation
  if (!dirPath || dirPath.trim() === "") {
    return "Error: Directory path cannot be empty";
  }
  
  try {
    // Check se già esiste
    const exists = await fileExists(dirPath);
    if (exists) {
      const stats = await fs.stat(dirPath);
      if (stats.isDirectory()) {
        return `Directory ${dirPath} already exists`;
      } else {
        return `Error: ${dirPath} exists but is not a directory`;
      }
    }
    
    // Crea directory
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
    return `Successfully created directory ${dirPath}`;
    
  } catch (error) {
    return `Error creating directory: ${(error as Error).message}`;
  }
}
```

---

## 🔄 Operazione 7: COPY & MOVE

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
    // Crea destination directory
    await fs.mkdir(dest, { recursive: true });
    
    // Leggi tutti i file
    const files = await fs.readdir(source, { withFileTypes: true });
    
    // Copy ricorsivamente
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
    // fs.rename funziona per move
    await fs.rename(source, dest);
    console.log(`✓ Moved: ${source} → ${dest}`);
    return `Successfully moved ${source} to ${dest}`;
  } catch (error) {
    return `Error moving file: ${(error as Error).message}`;
  }
}
```

---

## 🔐 Operazione 8: PERMISSIONS (Avanzato)

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

### Esempio: Make Executable

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

## 🛡️ Best Practices per Filesystem Operations

### 1. Sempre Usare Path.join()

```typescript
// ❌ BAD - Problemi su Windows vs Unix
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

// ✅ Normalize e valida
const safePath = path.normalize(userPath);
const absolutePath = path.resolve(safePath);

// Check che sia dentro la working directory
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
    
    // 2. Check che sia un file
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return `Error: ${filePath} is not a file`;
    }
    
    // 3. Check dimensione (evita file giganti)
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

### 4. Use Streams per File Grandi

```typescript
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";

async function copyLargeFile(source: string, dest: string): Promise<void> {
  // Stream è memory-efficient per file grandi
  await pipeline(
    createReadStream(source),
    createWriteStream(dest)
  );
}
```

---

## 🎯 Filesystem Tool Complete Example

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
npx ts-node agent.ts "Leggi package.json"

# Test 2: Write
npx ts-node agent.ts "Crea test.txt con 'hello world'"

# Test 3: List
npx ts-node agent.ts "Lista tutti i file nella directory corrente"

# Test 4: Stat
npx ts-node agent.ts "Dammi info su agent.ts"

# Test 5: Copy
npx ts-node agent.ts "Copia agent.ts in agent.backup.ts"

# Test 6: Move
npx ts-node agent.ts "Rinomina test.txt in test-renamed.txt"

# Test 7: Delete
npx ts-node agent.ts "Elimina test-renamed.txt"

# Test 8: Mkdir
npx ts-node agent.ts "Crea directory tmp/test/deep"
```

---

## 📊 Filesystem API Quick Reference

| Operazione | API | Uso |
|------------|-----|-----|
| Read file | `fs.readFile(path, encoding)` | Leggi contenuto |
| Write file | `fs.writeFile(path, data)` | Scrivi/sovrascrivi |
| Append | `fs.appendFile(path, data)` | Aggiungi a fine file |
| List dir | `fs.readdir(path, options)` | Elenca contenuti |
| File info | `fs.stat(path)` | Ottieni metadata |
| Check exist | `fs.access(path)` | Verifica esistenza |
| Delete file | `fs.unlink(path)` | Elimina file |
| Delete dir | `fs.rm(path, {recursive})` | Elimina directory |
| Copy | `fs.copyFile(src, dest)` | Copia file |
| Move/Rename | `fs.rename(old, new)` | Sposta/rinomina |
| Make dir | `fs.mkdir(path, {recursive})` | Crea directory |
| Change perms | `fs.chmod(path, mode)` | Modifica permessi |

---

## 💡 Pro Tips

1. **Usa path.join()**: Sempre per cross-platform compatibility
2. **Validate paths**: Previeni path traversal attacks
3. **Check before operations**: access, stat, size checks
4. **Handle all errors**: ENOENT, EACCES, EISDIR, etc
5. **Log operations**: Aiuta debugging
6. **Use streams**: Per file > 10MB
7. **Atomic operations**: Write to temp, then rename
8. **Backup critical files**: Prima di delete/overwrite

---

## 🎓 Esercizio Pratico

Implementa un tool completo `workspace_manager`:

```typescript
// Features da implementare:
// 1. Create project structure
// 2. Safe file operations with backup
// 3. Search files by pattern
// 4. Clean up temp files
// 5. Validate all paths

const workspaceManagerTool: Tool = {
  name: "workspace_manager",
  // La tua implementazione qui!
};
```

---

**Remember**: Il file system è il foundation di ogni coding agent. Padroneggiare queste operations ti permette di costruire agent che possono veramente manipolare progetti! 📁✨