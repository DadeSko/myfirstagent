# 🏗️ Architettura dell'Agent

## Overview

Questo agent segue l'architettura descritta da Geoffrey Huntley: **"300 linee di codice in un loop con LLM tokens"**.

## Componenti Principali

```
┌─────────────────────────────────────────┐
│         User Input (CLI)                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         Agent Loop (main)               │
│  ┌─────────────────────────────────┐   │
│  │  1. Build Messages Array        │   │
│  │  2. Call Anthropic API          │   │
│  │  3. Check Stop Reason           │   │
│  │  4. Execute Tools if needed     │   │
│  │  5. Add Results to Messages     │   │
│  │  6. Loop or Exit                │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         Tool Executor                    │
│  ┌──────────────────────────────────┐  │
│  │  readFile()                      │  │
│  │  listFiles()                     │  │
│  │  runBash()                       │  │
│  │  editFile()                      │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         File System / OS                │
└─────────────────────────────────────────┘
```

## Il Loop Agentico in Dettaglio

### Fase 1: Inizializzazione

```typescript
const messages = [{ role: "user", content: userMessage }];
const tools = [readFileTool, listFilesTool, bashTool, editFileTool];
```

L'agent parte con:
- Il messaggio dell'utente
- La definizione dei 4 tool disponibili

### Fase 2: Inferencing Loop

```typescript
while (true) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514", // Il "digital squirrel"
    max_tokens: 4096,
    tools: tools,
    messages: messages,
  });
  // ...
}
```

**Perché Claude Sonnet?**
- È "agentic" → biased verso action
- Vuole fare tool calls (come uno scoiattolo insegue noci)
- Non perde tempo a pensare → agisce incrementalmente

### Fase 3: Decision Making

```typescript
if (response.stop_reason === "end_turn") {
  // Finito! Mostra risposta e esci
  break;
}

if (response.stop_reason === "tool_use") {
  // Claude vuole usare un tool
  // → esegui e continua il loop
}
```

**Stop Reasons possibili:**
- `end_turn`: Claude ha finito, nessun tool necessario
- `tool_use`: Claude vuole chiamare uno o più tool
- `max_tokens`: Raggiunto limite token (rare)

### Fase 4: Tool Execution

```typescript
for (const block of response.content) {
  if (block.type === "tool_use") {
    const result = await executeTool(block.name, block.input);
    
    toolResults.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: result,
    });
  }
}
```

**Flow dei Tool:**
1. Claude decide: "Ho bisogno del tool X"
2. Fornisce `tool_name` e `input`
3. Agent esegue la funzione corrispondente
4. Risultato viene aggiunto ai messages
5. Loop ricomincia con il nuovo contesto

### Fase 5: Context Building

```typescript
messages.push({
  role: "assistant",
  content: response.content,
});

messages.push({
  role: "user",
  content: toolResults,
});
```

**Importante**: Ogni iterazione costruisce il context window:
```
[User: "Crea fizzbuzz.ts"]
[Assistant: "Uso edit_file tool"]
[User: Tool Result: "File created"]
[Assistant: "Ora lo eseguo con bash"]
[User: Tool Result: "1 2 Fizz..."]
[Assistant: "Ecco il risultato!"]
```

## I 4 Primitivi

### 1. Read File Tool

```typescript
async function readFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, "utf-8");
  return content;
}
```

**Use Cases:**
- Leggere codice esistente
- Analizzare contenuti
- Verificare output

### 2. List Files Tool

```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  return files.map(f => `${f.isDirectory() ? "📁" : "📄"} ${f.name}`).join("\n");
}
```

**Use Cases:**
- Esplorare struttura progetto
- Trovare file specifici
- Verificare esistenza file

### 3. Bash Tool

```typescript
async function runBash(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(command);
  return stdout || stderr;
}
```

**Use Cases:**
- Eseguire script
- Installare dipendenze
- Testare codice
- Git operations

### 4. Edit File Tool

```typescript
async function editFile(
  filePath: string,
  oldStr: string,
  newStr: string
): Promise<string> {
  if (oldStr === "") {
    // Crea nuovo file
    await fs.writeFile(filePath, newStr, "utf-8");
  } else {
    // Modifica file esistente
    const content = await fs.readFile(filePath, "utf-8");
    await fs.writeFile(filePath, content.replace(oldStr, newStr), "utf-8");
  }
  return "Success";
}
```

**Use Cases:**
- Creare nuovi file
- Modificare codice esistente
- Refactoring

## Lezioni Chiave dall'Architettura

### 1. "Less is More" nel Context Window

```typescript
// ❌ BAD: Alloca troppo
tools: [tool1, tool2, tool3, ..., tool50] // 76k tokens!

// ✅ GOOD: Solo tools necessari
tools: [readFile, listFiles, bash, editFile] // ~2k tokens
```

**Geoffrey's Rule**: 
> "Più allochi al context window, peggiori sono i risultati"

### 2. Tool Descriptions Matter

```typescript
// ❌ BAD
description: "Reads files"

// ✅ GOOD
description: "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names."
```

Le description sono **billboards** che nudgano il latent space di Claude.

### 3. Una Attività per Context Window

```typescript
// ❌ BAD: Riusa lo stesso agent loop
agent("Build API") → agent("Research meerkats") → agent("Design UI")

// ✅ GOOD: Nuovo loop per ogni task
agent("Build API") // Clear context
agent("Research meerkats") // Fresh start
agent("Design UI") // Clean slate
```

**Perché?** Il context si contamina:
- API + meerkats → UI con facts sui meerkats nell'API 🤦

## Sequence Diagram Completo

```
User
  │
  ├─→ "Create fizzbuzz.ts and run it"
  │
  ↓
Agent Loop (Iteration 1)
  │
  ├─→ Claude: Analyze request
  │   └─→ Decision: Need edit_file tool
  │
  ├─→ Execute: editFile("fizzbuzz.ts", "", "code...")
  │   └─→ Result: "File created"
  │
  ↓
Agent Loop (Iteration 2)
  │
  ├─→ Claude: File created, now need to run it
  │   └─→ Decision: Need bash tool
  │
  ├─→ Execute: runBash("ts-node fizzbuzz.ts")
  │   └─→ Result: "1\n2\nFizz\n4\nBuzz..."
  │
  ↓
Agent Loop (Iteration 3)
  │
  ├─→ Claude: Got results, task complete
  │   └─→ Decision: end_turn
  │
  └─→ Show final response to user
```

## Estensioni Future

### 5. Search Tool (Prossimo Step)
```typescript
const searchTool: Tool = {
  name: "code_search",
  description: "Search code using ripgrep",
  // Geoffrey usa ripgrep sotto il cofano!
};
```

### 6. MCP Integration
Puoi aggiungere Model Context Protocol servers:
```typescript
tools: [...basicTools, ...mcpTools]
```

**Attenzione**: Ogni MCP tool alloca context!

### 7. Oracle Pattern
Wired GPT-4 come tool per "reasoning":
```typescript
const oracleTool: Tool = {
  name: "oracle",
  description: "Ask GPT-4 for deep analysis",
};
```

## Performance Considerations

### Token Usage
- **System Prompt**: ~500 tokens
- **Tool Definitions**: ~2k tokens per 4 tools
- **Conversation History**: Cresce ad ogni iteration
- **Available**: ~176k tokens su 200k context window

### Loop Iterations
- Task semplici: 1-3 iterations
- Task complessi: 5-10 iterations
- Multi-step workflows: 10-20 iterations

### Costo per Task
```
Semplice (3 iterations): ~$0.01
Medio (7 iterations): ~$0.03
Complesso (15 iterations): ~$0.07
```

## Best Practices

1. **Clear Tool Descriptions**: Aiutano Claude a scegliere giusto
2. **Error Handling**: Ogni tool deve gestire gli errori
3. **Logging**: Console.log per debugging
4. **Context Management**: Una task, un loop
5. **Tool Efficiency**: Meno tool = migliori risultati

## Conclusione

Questa architettura dimostra il principio di Geoffrey:

> "Non c'è magia. Sono solo 300 linee di codice che girano in loop con LLM tokens."

L'intelligenza non è nell'harness (il nostro codice), ma nel **model** (Claude Sonnet) che:
- Sa quando chiamare tool
- Sa quali parametri passare
- Sa quando fermarsi

Il nostro lavoro è solo:
1. Definire tool chiari
2. Eseguirli correttamente
3. Far girare il loop

**That's it!** 🎯
