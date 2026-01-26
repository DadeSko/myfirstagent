# ⚡ Quick Start - 5 Minuti per il Tuo Primo Agent

## 🎯 Obiettivo
Avere il tuo agent funzionante in 5 minuti seguendo Geoffrey Huntley.

## 📋 Checklist Pre-Flight

- [ ] Node.js installato (`node --version`)
- [ ] npm installato (`npm --version`)
- [ ] API key Anthropic pronta ([Get it here](https://console.anthropic.com/settings/keys))

## 🚀 Setup (2 minuti)

```bash
# 1. Setup automatico
chmod +x setup.sh
./setup.sh

# 2. Configura API key
export ANTHROPIC_API_KEY='sk-ant-...'

# ✅ Done!
```

## 🧪 Primo Test (30 secondi)

```bash
# Test più semplice possibile
npx npx ts-node agent.ts "Lista tutti i file in questa directory"
```

**Nota**: Usa `npx ts-node` (con npx davanti) - questo funziona sempre senza installazioni globali!

**Output atteso:**
```
🤖 Agent starting...

User: Lista tutti i file in questa directory

Stop reason: tool_use

🔧 Tool: list_files
   Input: {
     "path": "."
   }
   ...

🤖 Claude:
Ecco i file nella directory...

✅ Agent finished
```

## 🎓 Secondo Test - FizzBuzz (1 minuto)

```bash
npx npx ts-node agent.ts
```

**Cosa succede:**
1. 🔧 Tool: `edit_file` → Crea fizzbuzz.ts
2. 🔧 Tool: `bash` → Esegue `ts-node fizzbuzz.ts`
3. ✅ Output: `1 2 Fizz 4 Buzz...`

## 📊 Cosa Stai Vedendo?

### Il Loop in Azione
```
User Input
    ↓
Claude pensa → "Serve edit_file"
    ↓
Esegue → Crea file
    ↓
Claude pensa → "Ora serve bash"
    ↓
Esegue → Run script
    ↓
Claude pensa → "Task complete"
    ↓
Mostra risultato
```

### I 4 Tool in Uso

| Tool | Quando Viene Usato | Esempio |
|------|-------------------|---------|
| 📖 `read_file` | Leggere contenuti | "Leggi README.md" |
| 📁 `list_files` | Esplorare directory | "Cosa c'è qui?" |
| ⚙️ `bash` | Eseguire comandi | "Esegui il test" |
| ✏️ `edit_file` | Creare/modificare | "Crea file.ts" |

## 💡 Test Veloci da Provare

### Test 1: Read
```bash
npx npx ts-node agent.ts "Leggi il README e dimmi di cosa parla"
```

### Test 2: Create
```bash
npx npx ts-node agent.ts "Crea hello.txt con 'Hello from my agent!'"
```

### Test 3: Execute
```bash
npx npx ts-node agent.ts "Esegui 'date' e dimmi che giorno è"
```

### Test 4: Multi-step
```bash
npx npx ts-node agent.ts "Crea test.js con console.log('works'), eseguilo, poi cancellalo"
```

## 🐛 Troubleshooting Rapido

### Errore: "ANTHROPIC_API_KEY not found"
```bash
export ANTHROPIC_API_KEY='your-key-here'
```

### Errore: "ts-node: command not found"
```bash
npm install
```

### Errore: Tool execution failed
- Controlla che il file path sia corretto
- Verifica i permessi della directory

## 📈 Livelli di Complessità

### Livello 1: Single Tool ⭐
Un solo tool per task
```bash
npx ts-node agent.ts "Lista file"
```

### Livello 2: Multi Tool ⭐⭐
Più tool in sequenza
```bash
npx ts-node agent.ts "Crea file.txt poi leggilo"
```

### Livello 3: Complex Workflow ⭐⭐⭐
Workflow articolato
```bash
npx ts-node agent.ts "Analizza agent.ts, crea un summary.md, poi eseguilo con cat"
```

## 🎯 Challenge di 5 Minuti

Prova a far fare all'agent questo task completo:

```bash
npx ts-node agent.ts "Crea una directory chiamata test-project, poi crea dentro 3 file: README.md con titolo 'My Project', package.json base, e index.ts con un hello world. Poi mostrami la struttura creata."
```

**Aspettati:**
- 🔧 bash → `mkdir test-project`
- 🔧 edit_file → Crea README.md
- 🔧 edit_file → Crea package.json
- 🔧 edit_file → Crea index.ts
- 🔧 list_files → Mostra struttura

## 🧠 Cosa Hai Imparato?

Nei primi 5 minuti hai visto:
1. ✅ Come funziona il loop agentico
2. ✅ Come Claude sceglie i tool
3. ✅ Come i tool vengono eseguiti in sequenza
4. ✅ Come il context si costruisce iterazione dopo iterazione

## 📚 Next Steps (Dopo i 5 Minuti)

1. **Leggi ARCHITECTURE.md** → Capisci il loop in profondità
2. **Leggi EXAMPLES.md** → Prova più test cases
3. **Sperimenta** → Modifica i tool descriptions
4. **Estendi** → Aggiungi il 5° tool (search)

## 💭 Geoffrey's Wisdom

> "It's not that hard to build a coding agent. It's 300 lines of code running in a loop with LLM tokens."

Hai appena costruito uno di questi agent in 5 minuti! 🎉

## 🔥 Pro Tips

1. **Osserva il Console Log**: Ogni tool call viene loggato
2. **Sperimenta con Query Vaghe**: Vedi come Claude interpreta
3. **Prova Task Multi-Step**: Claude è bravo a scomporli
4. **Non Aver Paura di Errori**: Sono parte del learning

## ✨ Celebra! 

Hai appena:
- ✅ Costruito il tuo primo coding agent
- ✅ Capito il loop agentico
- ✅ Visto i 4 primitivi in azione
- ✅ Fatto girare task complessi

**Questo è solo l'inizio.** 🚀

---

**Remember**: 
> "Go forward and build." — Geoffrey Huntley

Next: Apri ARCHITECTURE.md e capisci come funziona sotto il cofano! 🏗️