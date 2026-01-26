# 🤖 Il Mio Primo Agent - Davide's Coding Agent

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange?style=for-the-badge)

Agent TypeScript costruito seguendo la metodologia di Geoffrey Huntley.

## 🎯 Filosofia

Come dice Geoffrey:
> "300 linee di codice in un loop con LLM tokens. È davvero così semplice."

Questo agent implementa i **4 primitivi fondamentali** di ogni coding agent:

1. **📖 Read Tool** - Legge file
2. **📁 List Tool** - Elenca directory
3. **⚙️ Bash Tool** - Esegue comandi
4. **✏️ Edit Tool** - Modifica/crea file

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

## 🛠️ I 4 Primitivi

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

Una volta che padroneggi questi 4 primitivi, puoi:

1. Aggiungere un **Search Tool** (ripgrep)
2. Implementare **MCP servers**
3. Creare agent specializzati per il tuo workflow
4. Costruire orchestrazioni multi-agent

## 💭 Citazioni Chiave

> "Any disruption or job loss related to AI is not a result of AI itself, but rather a consequence of a lack of personal development."
> — Geoffrey Huntley

> "In 2025, you should be familiar with what a primary key is and how to create an agent."
> — Geoffrey Huntley

## 📚 Risorse

- [Geoffrey's Workshop](https://ghuntley.com/agent/)
- [Workshop Materials (Go)](https://github.com/ghuntley/how-to-build-a-coding-agent)
- [Anthropic SDK Docs](https://docs.anthropic.com)

## ✨ Credits

Agent costruito da **Davide** nel contesto del programma "Da Editor a Technical Contributor" per Effectual Technologies, seguendo gli insegnamenti di Geoffrey Huntley.

---

**Remember**: Questo è solo l'inizio. Come dice Geoffrey: "Go forward and build." 🚀