# 🚀 Migration Guide - Da Monolite a Moduli

Questa guida spiega come migrare un agent monolitico come il tuo verso una struttura modulare.

## Step-by-Step Migration

### Step 1: Crea la Struttura Directory

```bash
mkdir -p tools/primitives tools/high-level
```

### Step 2: Crea Types File

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

### Step 3: Estrai un Tool alla Volta

Per ogni tool nel monolite:

1. **Identifica il tool**
```typescript
// Nel monolite trovi:
const myTool: Tool = { ... };
async function executeMy(input) { ... }
```

2. **Crea file dedicato**
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
    // Copia l'implementazione qui
    return "result";
  }
};
```

3. **Aggiusta gli import**
```typescript
// Se il tool usa fs, path, etc:
import * as fs from "fs/promises";
import * as path from "path";
```

### Step 4: Crea Index File

```typescript
// tools/index.ts
export { tool1 } from "./primitives/tool1";
export { tool2 } from "./primitives/tool2";
// ... etc

export type { Tool, ToolImplementation } from "./types";
```

### Step 5: Refactora Agent.ts

**Prima:**
```typescript
// Tutto nel file
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

**Dopo:**
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
# Testa ogni tool individualmente
npx ts-node -e "
import { tool1 } from './tools';
console.log(await tool1.execute({ ... }));
"

# Testa l'agent completo
npx ts-node agent.ts "test command"
```

## Checklist Migrazione

- [ ] Directory structure creata
- [ ] types.ts creato
- [ ] Ogni tool estratto in file separato
- [ ] index.ts con tutti gli export
- [ ] agent.ts refactorizzato
- [ ] Import paths corretti
- [ ] Test passano
- [ ] Documentation aggiornata

## Tool Migration Template

Usa questo template per ogni tool:

```typescript
import { ToolImplementation } from "../types";
// Altri import necessari (fs, path, exec, etc)

export const TOOL_NAME: ToolImplementation = {
  definition: {
    name: "tool_name",
    description: `
    Descrizione dettagliata del tool.
    
    USE CASES:
    - Caso d'uso 1
    - Caso d'uso 2
    `,
    input_schema: {
      type: "object",
      properties: {
        param1: {
          type: "string",
          description: "Descrizione parametro"
        }
      },
      required: ["param1"]
    }
  },

  execute: async (input: { param1: string }) => {
    try {
      // Implementazione
      return "success result";
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }
};
```

## Common Pitfalls

### 1. Import Circolari
❌ **Sbagliato:**
```typescript
// tools/tool1.ts
import { tool2 } from "./tool2";  // ← Evita!
```

✅ **Corretto:**
```typescript
// I tool devono essere indipendenti
// Se serve composizione, crea un high-level tool
```

### 2. Shared State
❌ **Sbagliato:**
```typescript
// tools/tool1.ts
let sharedState = {};  // ← Evita state globale!
```

✅ **Corretto:**
```typescript
// Passa lo state come parametro
execute: async (input: { state: any }) => { ... }
```

### 3. Path Relativi
❌ **Sbagliato:**
```typescript
import { myTool } from "../primitives/my-tool";  // Da agent.ts
```

✅ **Corretto:**
```typescript
import { myTool } from "./tools";  // Usa index.ts
```

## Best Practices

### 1. Tool Size
- **Primitivi**: 30-100 righe
- **High-level**: 200-700 righe
- Se supera 700 righe, considera split

### 2. Naming
```
tools/
├── primitives/         ← Operazioni atomiche
│   └── read-file.ts
└── high-level/         ← Orchestrazioni
    └── project-init.ts
```

### 3. Documentation
Ogni tool deve avere:
- Descrizione chiara
- Examples nel description
- Input schema ben documentato

### 4. Error Handling
```typescript
execute: async (input) => {
  try {
    // Logic
    return successResult;
  } catch (error) {
    // SEMPRE cattura e ritorna stringa
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
    // Test isolato del tool
  });
});
```

### Integration Tests
```typescript
// tests/agent.test.ts
import { agentLoop } from "../agent";

describe("Agent", () => {
  it("completes task with multiple tools", async () => {
    // Test del loop completo
  });
});
```

## Esempio Completo

### Prima (agent.ts - 1000+ righe)
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

### Dopo (agent.ts - ~150 righe)
```typescript
import { readFileTool, listFilesTool } from "./tools";

const TOOLS = [readFileTool, listFilesTool];
const TOOL_MAP = new Map(TOOLS.map(t => [t.definition.name, t]));

async function executeTool(name, input) {
  return await TOOL_MAP.get(name)?.execute(input);
}

// ... agent loop ...
```

### Tool File (tools/primitives/read-file.ts - ~30 righe)
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

## Timeline Tipica

Per un agent con 5-10 tool:
- **Setup directory**: 5 minuti
- **Crea types.ts**: 5 minuti
- **Migra un tool**: 15-20 minuti
- **Crea index.ts**: 10 minuti
- **Refactora agent.ts**: 30 minuti
- **Testing**: 30 minuti

**Totale: 2-3 ore** per una migrazione completa

## Risorse

- [REFACTORING.md](./REFACTORING.md) - Dettagli del refactoring
- [COMPARISON.md](./COMPARISON.md) - Prima vs Dopo
- [tools/](./tools/) - Codice di riferimento

## Domande Frequenti

### Q: Devo migrare tutti i tool in una volta?
**A**: No! Migra uno alla volta. Puoi avere sia la versione vecchia che nuova temporaneamente.

### Q: Come gestisco tool che dipendono l'uno dall'altro?
**A**: Crea high-level tools che orchestrano i primitivi.

### Q: Cosa faccio con helper functions condivise?
**A**: Mettile in `tools/utils.ts` o nel tool che le usa principalmente.

### Q: Posso usare questo pattern per altri agent framework?
**A**: Sì! Il pattern è framework-agnostic.

---

Buona migrazione! 🚀
