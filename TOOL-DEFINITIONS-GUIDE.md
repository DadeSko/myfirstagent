# 🔧 Tool Definition Structure - Deep Dive

Guida approfondita su come funzionano le definizioni dei tool negli agent.

---

## 🎯 Cos'è una Tool Definition?

Una tool definition è un **contratto** tra il tuo agent e Claude. È composta da tre parti:

```typescript
interface Tool {
  name: string;              // 1. Nome del tool
  description: string;       // 2. "Billboard" per Claude
  input_schema: {            // 3. Schema dei parametri
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
```

Pensa a questo come a una **inserzione di lavoro**:
- **Nome**: Il titolo del ruolo ("Software Engineer")
- **Description**: La descrizione del ruolo e responsabilità
- **Input Schema**: I requisiti/qualifiche necessarie

---

## 📋 Parte 1: Name

### Regole per il Nome

```typescript
// ✅ GOOD
name: "read_file"
name: "list_files"
name: "bash"
name: "edit_file"

// ❌ BAD
name: "readFile"        // Evita camelCase
name: "read-file"       // Evita trattini (usa underscore)
name: "File Reader"     // Evita spazi
name: "r"              // Troppo corto, non descrittivo
```

### Best Practices

1. **Snake case**: Usa `underscore_case`
2. **Descrittivo**: Il nome deve dire cosa fa
3. **Breve ma chiaro**: 1-3 parole
4. **Verbo + Sostantivo**: `read_file`, `list_files`, `execute_bash`

### Esempi dal Nostro Agent

```typescript
const readFileTool: Tool = {
  name: "read_file",      // Chiaro: legge un file
  // ...
};

const bashTool: Tool = {
  name: "bash",           // Succinto: esegue bash
  // ...
};
```

---

## 💬 Parte 2: Description (Il Billboard)

### Perché è Importante?

La description è un **"billboard"** che nudge il **latent space** di Claude. 

**Geoffrey's Insight**: 
> "It's just a function with a billboard on top that nudges the LLM's latent space to invoke that function."

### Anatomia di una Buona Description

```typescript
description: `
  [COSA FA il tool]
  [QUANDO usarlo]
  [QUANDO NON usarlo - opzionale]
  [DETTAGLI TECNICI - opzionale]
`
```

### Esempio: read_file

```typescript
// ❌ BAD - Troppo generica
description: "Reads files"

// ✅ GOOD - Completa e guidante
description: `Read the contents of a given relative file path. 
Use this when you want to see what's inside a file. 
Do not use this with directory names.`
```

**Breakdown**:
1. ✅ **Cosa fa**: "Read the contents..."
2. ✅ **Quando usare**: "Use this when you want to see..."
3. ✅ **Quando NON usare**: "Do not use this with directory names"

### Esempio: bash

```typescript
// ❌ BAD
description: "Runs commands"

// ✅ GOOD
description: "Execute a bash command and return its output. Use this to run shell commands."
```

### Esempio: edit_file

```typescript
// ✅ EXCELLENT - Molto dettagliata
description: `Edit a file by replacing old_str with new_str. 
If old_str is empty, creates a new file with new_str as content.`
```

**Nota**: Spiega anche il caso speciale (creazione nuovo file)!

### Pro Tips per Description

```typescript
// 1. Sii specifico sul formato output
description: `List files and directories at a given path. 
Returns files with 📄 prefix and directories with 📁 prefix.
If no path is provided, lists files in the current directory.`

// 2. Includi esempi se aiuta
description: `Search for code patterns using ripgrep.
Example: search for "function" in all .ts files.
Use this to find code patterns, function definitions, or variable usage.`

// 3. Menziona limitazioni
description: `Execute a bash command and return its output.
Note: Commands with interactive prompts may hang. 
Use for non-interactive commands only.`
```

---

## 🎨 Parte 3: Input Schema

L'input schema descrive **quali parametri** accetta il tool e **come sono strutturati**.

### Struttura Base

```typescript
input_schema: {
  type: "object",           // Sempre "object"
  properties: {
    param_name: {
      type: "string",       // Tipo del parametro
      description: "..."    // Cosa rappresenta
    }
  },
  required: ["param_name"]  // Parametri obbligatori
}
```

### Tipi di Parametri

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

### Esempio Completo: read_file

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
    required: ["path"]  // path è obbligatorio
  }
};
```

**Cosa succede quando Claude usa questo tool**:
```json
{
  "name": "read_file",
  "input": {
    "path": "agent.ts"
  }
}
```

### Esempio Completo: bash

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

**Claude chiama così**:
```json
{
  "name": "bash",
  "input": {
    "command": "ls -la"
  }
}
```

### Esempio Completo: edit_file

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
    required: ["path", "old_str", "new_str"]  // Tutti obbligatori!
  }
};
```

**Claude chiama così**:
```json
// Crea nuovo file
{
  "name": "edit_file",
  "input": {
    "path": "test.txt",
    "old_str": "",
    "new_str": "Hello World!"
  }
}

// Modifica file esistente
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

## 🎭 Parametri Opzionali vs Required

### Esempio: list_files

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
    // ⚠️ NOTA: "required" è assente!
    // Questo significa che "path" è OPZIONALE
  }
};
```

**Implementazione deve gestire il caso opzionale**:
```typescript
async function listFiles(dirPath: string = "."): Promise<string> {
  // ⬆️ Default value "." se non fornito
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  // ...
}
```

**Claude può chiamare in due modi**:
```json
// Con path
{
  "name": "list_files",
  "input": {
    "path": "./src"
  }
}

// Senza path (usa default)
{
  "name": "list_files",
  "input": {}
}
```

---

## 🔬 Advanced: Enum e Constraints

### Enum (Valori Limitati)

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

Claude può usare solo uno dei valori enum!

### Constraints (Numeri)

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

## 💡 Come Claude Decide Quale Tool Usare?

### Il Processo di Decision Making

```
User: "Lista tutti i file TypeScript"
         ↓
Claude analizza la query
         ↓
Claude guarda TUTTE le tool descriptions
         ↓
Claude vede: "list_files" - "List files and directories..."
         ↓
"Questo tool è perfetto!"
         ↓
Claude chiama: list_files({ path: "." })
```

### Esempio Real-World

**User**: "Crea fizzbuzz.ts ed eseguilo"

**Claude's Thought Process** (ipotetico):
```
Step 1: "Crea fizzbuzz.ts"
  → Guardo i tool...
  → "edit_file" ha "creates a new file" nella description
  → Uso edit_file!

Step 2: "eseguilo"
  → Devo eseguire un file TypeScript
  → "bash" può "execute commands"
  → Uso bash con "ts-node fizzbuzz.ts"!
```

---

## 🎯 Best Practices Riassuntive

### 1. Nome
✅ Snake case, descrittivo, verbo+sostantivo

### 2. Description
✅ Spiega cosa fa
✅ Quando usarlo
✅ Quando NON usarlo
✅ Casi speciali

### 3. Input Schema
✅ Type preciso
✅ Description chiara per ogni parametro
✅ Required solo per parametri davvero necessari
✅ Default values nell'implementazione per parametri opzionali

---

## 📊 Template per Creare Nuovi Tool

```typescript
const myNewTool: Tool = {
  // 1. Nome: snake_case, verbo+sostantivo
  name: "my_action",
  
  // 2. Description: cosa, quando, dettagli
  description: `
    [Primary action description]
    [When to use this tool]
    [Special cases or limitations]
  `,
  
  // 3. Schema: definisci parametri
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
    required: ["required_param"]  // Solo i parametri obbligatori
  }
};
```

---

## 🧪 Esercizio Pratico

Prova a creare la definition per un tool `create_directory`:

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

Poi implementa la funzione:
```typescript
async function createDirectory(
  dirPath: string, 
  recursive: boolean = true
): Promise<string> {
  // La tua implementazione qui!
}
```

---

**Remember**: Le tool definitions sono il **linguaggio** con cui parli a Claude. Più sono chiare, meglio Claude capisce cosa usare e quando! 🎯