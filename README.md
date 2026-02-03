# 🤖 Il Mio Primo Agent - Davide's Coding Agent

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange?style=for-the-badge)

Agent TypeScript costruito seguendo la metodologia di Geoffrey Huntley.

## 🎯 Filosofia

Come dice Geoffrey:
> "300 linee di codice in un loop con LLM tokens. È davvero così semplice."

Questo agent implementa i **5 primitivi fondamentali** di ogni coding agent professionale:

1. **📖 Read Tool** - Legge file
2. **📁 List Tool** - Elenca directory
3. **⚙️ Bash Tool** - Esegue comandi
4. **✏️ Edit Tool** - Modifica/crea file
5. **🔍 Code Search Tool** - Cerca pattern nel codice (ripgrep)

## 🚀 Setup

```bash
# Installa le dipendenze
npm install

# Configura la tua API key
export ANTHROPIC_API_KEY='your-key-here'
```

## 💡 Come usarlo

```bash
# Esempio 1: Lista file
npx ts-node agent.ts "Elenca tutti i file TypeScript in questa directory"

# Esempio 2: Crea un file
npx ts-node agent.ts "Crea un file chiamato test.txt con il contenuto 'Hello World'"

# Esempio 3: FizzBuzz (come nell'esempio di Geoffrey)
npx ts-node agent.ts "Crea fizzbuzz.ts che stampa fizzbuzz fino a 20 ed eseguilo"

# Esempio 4: Analisi codice
npx ts-node agent.ts "Leggi agent.ts e dimmi quante funzioni ci sono"

# Esempio 5: Code Search (nuovo!)
npx ts-node agent.ts "Cerca tutte le funzioni async nel progetto"

# Esempio 6: Find TODOs
npx ts-node agent.ts "Trova tutti i TODO e FIXME nel codice"
```

**Nota**: Usa `npx ts-node` invece di solo `ts-node` se non hai installato ts-node globalmente.

## 🧠 Come funziona

L'agent è costruito su un **loop semplice**:

```typescript
while (true) {
  1. Invia messaggio a Claude
  2. Claude decide se usare tools
  3. Se usa tools → esegui e ritorna risultati
  4. Se finito → mostra risposta finale
}
```

### Il Loop Agentico

```
User Input
    ↓
[Claude Inference]
    ↓
Tool Call? 
    ↓ YES          ↓ NO
Execute Tool   End Turn
    ↓              ↓
Add Result    Show Response
    ↓
[Loop Back]
```

## 🛠️ I 5 Primitivi

### 1. Read File Tool
```typescript
await readFile("myfile.txt")
```
Legge il contenuto di un file.

### 2. List Files Tool
```typescript
await listFiles("./src")
```
Elenca file e directory.

### 3. Bash Tool
```typescript
await runBash("ls -la")
```
Esegue comandi shell.

### 4. Edit File Tool
```typescript
await editFile("test.txt", "", "nuovo contenuto")
```
Crea o modifica file.

### 5. Code Search Tool
```typescript
await codeSearch({ pattern: "async function", file_type: "ts" })
```
Cerca pattern nel codice usando ripgrep. Il 5° primitivo secondo Geoffrey:
> "What if I were to tell you that there is no magic for indexing source code? Nearly every coding tool uses ripgrep under the hood."

## 📚 Documentation

Documentazione completa disponibile:

- **[QUICKSTART.md](QUICKSTART.md)** - Setup rapido in 5 minuti
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Deep dive nell'architettura dell'agent
- **[EXAMPLES.md](EXAMPLES.md)** - Test cases ed esempi pratici
- **[LEARNING-JOURNAL.md](LEARNING-JOURNAL.md)** - Technical progress e insights

### Guide Tecniche Approfondite

- **[TOOL-DEFINITIONS-GUIDE.md](TOOL-DEFINITIONS-GUIDE.md)** - Tool definition structure
- **[ERROR-HANDLING-GUIDE.md](ERROR-HANDLING-GUIDE.md)** - Error handling patterns
- **[FILESYSTEM-GUIDE.md](FILESYSTEM-GUIDE.md)** - Filesystem operations
- **[CODE-SEARCH-GUIDE.md](CODE-SEARCH-GUIDE.md)** - Code search implementation

### Setup & Troubleshooting

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Soluzioni ai problemi comuni
- **[GITHUB-SETUP.md](GITHUB-SETUP.md)** - Guida per pubblicare su GitHub
- **[GIT-CHEATSHEET.md](GIT-CHEATSHEET.md)** - Comandi Git essenziali

## 🎓 Lezioni Chiave da Geoffrey

### Non tutti gli LLM sono agentici
- **Agentic** (Claude Sonnet): "scoiattolo digitale" che vuole fare tool calls
- **Oracle** (GPT-4): pensiero profondo, summarization
- **High Safety**: Anthropic, OpenAI
- **Low Safety**: Grok

### Context Window Management
> "Less is more, folks. Less is more."

- Context window è come un Commodore 64
- Più allochi, peggiori sono i risultati
- Usa **una sola attività per context window**

### Il Loop è Tutto
300 linee di codice che girano in loop con LLM tokens. Non c'è magia!

## 📊 Struttura del Progetto

```
.
├── agent.ts           # Il cuore dell'agent
├── package.json       # Dipendenze
├── tsconfig.json      # Config TypeScript
└── README.md         # Questa guida
```

## 🔮 Prossimi Passi

Una volta che padroneggi questi 5 primitivi, puoi:

1. ✅ ~~Aggiungere un **Search Tool** (ripgrep)~~ - Completato!
2. Implementare **MCP servers** per estendere le capabilities
3. Creare agent specializzati per workflow specifici
4. Costruire orchestrazioni multi-agent
5. Aggiungere caching e ottimizzazioni performance

## 💭 Citazioni Chiave

> "Any disruption or job loss related to AI is not a result of AI itself, but rather a consequence of a lack of personal development."
> — Geoffrey Huntley

> "In 2025, you should be familiar with what a primary key is and how to create an agent."
> — Geoffrey Huntley

## 📚 Risorse

### Geoffrey Huntley's Materials
- [Agent Workshop](https://ghuntley.com/agent/) - Workshop completo su come costruire agent
- [Workshop Materials (Go)](https://github.com/ghuntley/how-to-build-a-coding-agent) - Implementazione in Go
- [6-Month Recap](https://ghuntley.com/six-month-recap/) - Insights sul futuro degli agent

### Anthropic Documentation
- [Anthropic SDK Docs](https://docs.anthropic.com) - Documentazione ufficiale
- [Tool Use Guide](https://docs.anthropic.com/en/docs/tool-use) - Come usare i tool

### Technical References
- [ripgrep](https://github.com/BurntSushi/ripgrep) - Il tool di code search che tutti usano
- [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api) - Filesystem operations

## ✨ Credits

Agent costruito da **Davide** nel contesto del programma "Da Editor a Technical Contributor" per Effectful Technologies, seguendo gli insegnamenti di Geoffrey Huntley.

---

**Remember**: Questo è solo l'inizio. Come dice Geoffrey: "Go forward and build." 🚀