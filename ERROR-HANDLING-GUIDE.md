# 🛡️ Error Handling in Agents - Deep Dive

Guida completa su come gestire gli errori negli agent in modo robusto e professionale.

---

## 🎯 Perché l'Error Handling è Critico?

Gli agent interagiscono con:
- ❌ File system (file potrebbe non esistere)
- ❌ Shell commands (comando potrebbe fallire)
- ❌ Network (API potrebbe essere down)
- ❌ User input (potrebbe essere malformato)

**Senza error handling**: L'agent crasha e l'utente non sa perché! 💥

**Con error handling**: L'agent gestisce l'errore, informa Claude, Claude informa l'utente, e magari riprova! ✅

---

## 📊 I 3 Livelli di Error Handling

```
┌─────────────────────────────┐
│  1. Tool Level              │  ← Cattura errori specifici
│     (readFile, bash, etc)   │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  2. Executor Level          │  ← Cattura errori di tool execution
│     (executeTool function)  │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  3. Loop Level              │  ← Cattura errori di API calls
│     (agentLoop function)    │
└─────────────────────────────┘
```

---

## 🔧 Livello 1: Tool-Level Error Handling

### Pattern Base: Try-Catch con Messaggio Chiaro

```typescript
async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(`✓ Read file: ${filePath} (${content.length} bytes)`);
    return content;
  } catch (error) {
    // ⬇️ Ritorna MESSAGGIO DI ERRORE, non throw!
    return `Error reading file: ${(error as Error).message}`;
  }
}
```

**Perché NON throw?**

```typescript
// ❌ BAD - Crasha tutto l'agent
async function readFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, "utf-8");
  return content;  // Se fallisce → CRASH!
}

// ✅ GOOD - Claude riceve l'errore e può reagire
async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    return `Error reading file: ${(error as Error).message}`;
    // Claude vede questo messaggio e può provare altro!
  }
}
```

### Esempio: bash Tool

```typescript
async function runBash(command: string): Promise<string> {
  try {
    console.log(`⚙️  Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    const output = stdout || stderr;
    console.log(`✓ Command completed (${output.length} bytes)`);
    return output;
  } catch (error) {
    // ⬇️ Messaggio di errore dettagliato
    const err = error as Error & { code?: number; stderr?: string };
    return `Error executing command: ${err.message}${err.stderr ? '\n' + err.stderr : ''}`;
  }
}
```

**Cosa succede in pratica**:

```typescript
// User chiede: "Esegui comando 'nonexistent-command'"
// Claude chiama: bash({ command: "nonexistent-command" })

// ❌ Senza error handling:
// → CRASH! Agent muore

// ✅ Con error handling:
// → Ritorna: "Error executing command: command not found: nonexistent-command"
// → Claude riceve questo messaggio
// → Claude risponde: "Il comando non esiste. Vuoi provare qualcos'altro?"
```

### Esempio: edit_file Tool

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  try {
    if (oldStr === "") {
      // Crea nuovo file
      await fs.writeFile(filePath, newStr, "utf-8");
      console.log(`✓ Created new file: ${filePath} (${newStr.length} bytes)`);
      return `Successfully created file ${filePath}`;
    } else {
      // Modifica file esistente
      const content = await fs.readFile(filePath, "utf-8");
      
      // ⬇️ VALIDAZIONE: old_str esiste nel file?
      if (!content.includes(oldStr)) {
        return `Error: Could not find "${oldStr}" in ${filePath}`;
      }
      
      const newContent = content.replace(oldStr, newStr);
      await fs.writeFile(filePath, newContent, "utf-8");
      console.log(`✓ Edited file: ${filePath}`);
      return `Successfully edited file ${filePath}`;
    }
  } catch (error) {
    return `Error editing file: ${(error as Error).message}`;
  }
}
```

**Nota**: Oltre a try-catch, abbiamo anche **validazione logica**!

---

## 🎮 Livello 2: Executor-Level Error Handling

### Pattern: Wrapper con Fallback

```typescript
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  try {
    switch (toolName) {
      case "read_file":
        return await readFile(toolInput.path);
      
      case "list_files":
        return await listFiles(toolInput.path || ".");
      
      case "bash":
        return await runBash(toolInput.command);
      
      case "edit_file":
        return await editFile(
          toolInput.path, 
          toolInput.old_str, 
          toolInput.new_str
        );
      
      default:
        // ⬇️ Tool sconosciuto
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    // ⬇️ Catch-all per errori non previsti
    return `Unexpected error executing ${toolName}: ${(error as Error).message}`;
  }
}
```

**Cosa protegge**:
- ✅ Tool name typo/sconosciuto
- ✅ Errori non catchati nei tool individuali
- ✅ Problemi di parsing input

---

## 🔄 Livello 3: Loop-Level Error Handling

### Pattern: Retry con Backoff

```typescript
async function agentLoop(userMessage: string) {
  console.log("\n🤖 Agent starting...\n");
  
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage }
  ];

  const MAX_ITERATIONS = 20;  // ⬅️ Limite iterazioni
  let iterations = 0;

  try {
    while (true) {
      iterations++;
      
      // ⬇️ Protezione contro loop infinito
      if (iterations > MAX_ITERATIONS) {
        console.log(`⚠️  Reached max iterations (${MAX_ITERATIONS})`);
        break;
      }

      // ⬇️ API call con error handling
      let response;
      try {
        response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          tools: tools,
          messages: messages,
        });
      } catch (error) {
        // ⬇️ Errori API (rate limit, network, etc)
        console.error("❌ API Error:", error);
        
        // Se è rate limit, potresti fare retry
        if ((error as any).status === 429) {
          console.log("⏳ Rate limited, waiting 60s...");
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;  // Riprova
        }
        
        throw error;  // Altri errori → esci
      }

      // ... resto del loop
    }
  } catch (error) {
    // ⬇️ Catch finale
    console.error("\n❌ Fatal error in agent loop:");
    console.error(error);
    throw error;
  }
  
  console.log("\n✅ Agent finished\n");
}
```

---

## 🎨 Pattern Avanzati

### 1. Error Recovery con Retry

```typescript
async function readFileWithRetry(
  filePath: string, 
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      lastError = error as Error;
      console.log(`⚠️  Retry ${i + 1}/${maxRetries} for ${filePath}`);
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  return `Error reading file after ${maxRetries} retries: ${lastError?.message}`;
}
```

### 2. Validation Before Execution

```typescript
async function runBash(command: string): Promise<string> {
  // ⬇️ Validazione input
  if (!command || command.trim() === "") {
    return "Error: Command cannot be empty";
  }
  
  // ⬇️ Safety check (opzionale)
  const dangerousCommands = ["rm -rf /", ":(){ :|:& };:"];
  if (dangerousCommands.some(cmd => command.includes(cmd))) {
    return "Error: Dangerous command detected and blocked";
  }
  
  try {
    const { stdout, stderr } = await execAsync(command);
    return stdout || stderr;
  } catch (error) {
    return `Error executing command: ${(error as Error).message}`;
  }
}
```

### 3. Structured Error Objects

```typescript
interface ToolResult {
  success: boolean;
  data?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

async function readFileStructured(filePath: string): Promise<ToolResult> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return {
      success: true,
      data: content
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return {
      success: false,
      error: {
        code: err.code || "UNKNOWN",
        message: err.message,
        details: { path: filePath }
      }
    };
  }
}

// Uso:
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  if (toolName === "read_file") {
    const result = await readFileStructured(toolInput.path);
    
    if (result.success) {
      return result.data!;
    } else {
      // ⬇️ Possiamo decidere cosa fare in base al code!
      if (result.error?.code === "ENOENT") {
        return `File not found: ${toolInput.path}. Would you like me to create it?`;
      }
      return `Error: ${result.error?.message}`;
    }
  }
  // ...
}
```

---

## 🔍 Debugging Error Handling

### Logging Strategico

```typescript
async function runBash(command: string): Promise<string> {
  // ⬇️ Log PRIMA dell'esecuzione
  console.log(`⚙️  Executing: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    const output = stdout || stderr;
    
    // ⬇️ Log SUCCESS con dettagli
    console.log(`✓ Command completed (${output.length} bytes)`);
    
    return output;
  } catch (error) {
    const err = error as Error;
    
    // ⬇️ Log ERROR con dettagli
    console.error(`❌ Command failed: ${command}`);
    console.error(`   Error: ${err.message}`);
    
    return `Error executing command: ${err.message}`;
  }
}
```

**Output quando funziona**:
```
⚙️  Executing: ls -la
✓ Command completed (1245 bytes)
```

**Output quando fallisce**:
```
⚙️  Executing: nonexistent-command
❌ Command failed: nonexistent-command
   Error: Command failed: nonexistent-command
```

### Error Context

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  const context = {
    file: filePath,
    operation: oldStr === "" ? "create" : "edit",
    oldLength: oldStr.length,
    newLength: newStr.length
  };
  
  try {
    console.log(`📝 Editing file:`, context);
    
    // ... operazioni ...
    
    console.log(`✓ Success:`, context);
    return `Successfully ${context.operation}d file ${filePath}`;
    
  } catch (error) {
    console.error(`❌ Failed:`, context, error);
    return `Error ${context.operation}ing file: ${(error as Error).message}`;
  }
}
```

---

## 📊 Error Handling Checklist

### Per Ogni Tool Function

- [ ] ✅ Wrapped in try-catch
- [ ] ✅ Return error message (don't throw)
- [ ] ✅ Input validation
- [ ] ✅ Meaningful error messages
- [ ] ✅ Logging (success & failure)

### Per executeTool

- [ ] ✅ Default case for unknown tools
- [ ] ✅ Catch-all error handler
- [ ] ✅ Type safety checks

### Per agentLoop

- [ ] ✅ API call error handling
- [ ] ✅ Max iterations limit
- [ ] ✅ Rate limit handling
- [ ] ✅ Final catch-all

---

## 🎯 Best Practices

### 1. Fail Gracefully

```typescript
// ❌ BAD - Crasha tutto
async function readFile(path: string): Promise<string> {
  return await fs.readFile(path, "utf-8");
}

// ✅ GOOD - Ritorna errore come stringa
async function readFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, "utf-8");
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}
```

### 2. Be Specific

```typescript
// ❌ BAD - Messaggio generico
catch (error) {
  return "Error";
}

// ✅ GOOD - Messaggio dettagliato
catch (error) {
  return `Error reading file ${filePath}: ${(error as Error).message}`;
}
```

### 3. Log Everything

```typescript
// ❌ BAD - Silent failure
try {
  await doSomething();
} catch {}

// ✅ GOOD - Log per debugging
try {
  console.log("Starting operation...");
  await doSomething();
  console.log("✓ Success");
} catch (error) {
  console.error("❌ Failed:", error);
}
```

### 4. Validate Input

```typescript
async function runBash(command: string): Promise<string> {
  // ⬇️ Validazione PRIMA di try-catch
  if (!command || command.trim() === "") {
    return "Error: Command cannot be empty";
  }
  
  try {
    // ... esecuzione ...
  } catch (error) {
    // ...
  }
}
```

---

## 🧪 Testing Error Handling

### Testa gli Edge Cases

```bash
# Test 1: File non esistente
npx ts-node agent.ts "Leggi il file nonexistent.txt"

# Expected: "Error reading file: ENOENT: no such file or directory"

# Test 2: Comando invalido
npx ts-node agent.ts "Esegui comando 'command-does-not-exist'"

# Expected: "Error executing command: command not found"

# Test 3: Edit su file non esistente
npx ts-node agent.ts "Modifica hello.txt sostituendo 'x' con 'y'"

# Expected: "Error reading file: ENOENT..." o creazione file se gestito

# Test 4: Directory invece di file
npx ts-node agent.ts "Leggi node_modules"

# Expected: "Error: EISDIR: illegal operation on a directory"
```

---

## 🎓 Real-World Example

Ecco come gestirebbe un errore in un flusso completo:

```
User: "Crea test.txt con 'hello', leggilo, poi cancellalo"

Step 1: edit_file("test.txt", "", "hello")
  → Success: "Created test.txt"

Step 2: read_file("test.txt")
  → Success: "hello"

Step 3: bash("rm test.txt")
  → Success: "" (nessun output)

✅ Tutto ok!
```

```
User: "Leggi nonexistent.txt"

Step 1: read_file("nonexistent.txt")
  → try { fs.readFile(...) }
  → catch (error) {
       return "Error reading file: ENOENT: no such file or directory"
     }
  → Claude riceve: "Error reading file: ENOENT..."
  → Claude risponde: "Il file nonexistent.txt non esiste. Vuoi che lo crei?"

✅ Errore gestito gracefully!
```

---

## 💡 Pro Tips

1. **Return, Don't Throw**: Nei tool, return error messages
2. **Be Descriptive**: Include file path, comando, etc. nell'errore
3. **Log Everything**: Success e failure
4. **Validate First**: Check input prima di operazioni costose
5. **Fail Fast**: Se qualcosa è chiaramente sbagliato, ritorna errore subito
6. **Context Matters**: Include info rilevanti nell'error message

---

## 🎯 Esercizio Pratico

Aggiungi error handling robusto a questa funzione:

```typescript
// ❌ Versione senza error handling
async function createDirectory(dirPath: string): Promise<string> {
  await fs.mkdir(dirPath, { recursive: true });
  return `Created directory ${dirPath}`;
}

// ✅ Tua versione con error handling
async function createDirectory(dirPath: string): Promise<string> {
  // Il tuo codice qui!
  // Considera:
  // - path vuoto?
  // - path già esistente?
  // - permessi mancanti?
  // - try-catch?
  // - logging?
}
```

**Soluzione**:
```typescript
async function createDirectory(dirPath: string): Promise<string> {
  // Validation
  if (!dirPath || dirPath.trim() === "") {
    return "Error: Directory path cannot be empty";
  }
  
  try {
    console.log(`📁 Creating directory: ${dirPath}`);
    
    // Check if already exists
    try {
      await fs.access(dirPath);
      return `Directory ${dirPath} already exists`;
    } catch {
      // Doesn't exist, proceed to create
    }
    
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
    return `Successfully created directory ${dirPath}`;
    
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Failed to create directory ${dirPath}:`, err);
    return `Error creating directory: ${err.message}`;
  }
}
```

---

**Remember**: Good error handling è ciò che separa un toy project da production-ready code! 🛡️