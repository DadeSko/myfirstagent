# 🧪 Esempi di Test per l'Agent

**Nota Importante**: Tutti gli esempi usano `npx ts-node` invece di solo `ts-node`. Questo funziona sempre senza bisogno di installazioni globali!

## Test di Base

### 1. Lista File
```bash
npx ts-node agent.ts "Mostrami tutti i file in questa directory"
```

### 2. Leggi File
```bash
npx ts-node agent.ts "Leggi il contenuto di README.md"
```

### 3. Crea File Semplice
```bash
npx ts-node agent.ts "Crea un file chiamato hello.txt con scritto 'Ciao dal mio primo agent!'"
```

### 4. Esegui Comando
```bash
npx ts-node agent.ts "Dimmi quanti file TypeScript ci sono in questa directory"
```

## Test Avanzati

### 5. FizzBuzz (come Geoffrey)
```bash
npx ts-node agent.ts "Crea un file fizzbuzz.ts che implementa fizzbuzz fino a 20 ed eseguilo per verificare che funzioni"
```

### 6. Analisi Codice
```bash
npx ts-node agent.ts "Leggi agent.ts e fammi un sommario delle funzioni principali"
```

### 7. Refactoring
```bash
npx ts-node agent.ts "Crea una versione semplificata di agent.ts chiamata simple-agent.ts che ha solo il read_file tool"
```

### 8. Multi-step Task
```bash
npx ts-node agent.ts "Crea una directory chiamata examples, poi crea 3 file dentro: example1.ts, example2.ts, example3.ts, ognuno con un semplice console.log"
```

## Test Creativi

### 9. Riddle Test (ispirato da Geoffrey)
```bash
# Prima crea il riddle
echo "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?" > riddle.txt

# Poi chiedi all'agent
npx ts-node agent.ts "Leggi riddle.txt e dimmi la risposta"
```

### 10. Generazione Documentazione
```bash
npx ts-node agent.ts "Analizza agent.ts e crea un file ARCHITECTURE.md che spiega come funziona l'agent"
```

### 11. Test Suite Creator
```bash
npx ts-node agent.ts "Crea un file test.ts con Jest che testa le funzioni readFile, listFiles, e runBash"
```

### 12. Package Creator
```bash
npx ts-node agent.ts "Crea un nuovo package.json per un progetto chiamato 'my-tool' con TypeScript e le dipendenze base necessarie"
```

## Test di Debugging

### 13. Error Handling
```bash
npx ts-node agent.ts "Prova a leggere un file che non esiste chiamato nonexistent.txt e dimmi cosa succede"
```

### 14. Performance Check
```bash
npx ts-node agent.ts "Esegui il comando 'ls -la' e dimmi quanti file vedi"
```

## Test Workflow Reali

### 15. Blog Post Creator
```bash
npx ts-node agent.ts "Crea una struttura per un blog post markdown chiamato 'my-agent-journey.md' con titolo, introduzione, 3 sezioni e conclusione"
```

### 16. Config File Generator
```bash
npx ts-node agent.ts "Crea un file .gitignore appropriato per un progetto TypeScript/Node"
```

### 17. Script Generator
```bash
npx ts-node agent.ts "Crea uno script bash chiamato setup.sh che installa le dipendenze e configura l'environment"
```

## Tips per Testare

1. **Inizia Semplice**: Testa un tool alla volta
2. **Poi Combina**: Fai task che richiedono più tool insieme
3. **Osserva il Loop**: Guarda come Claude decide quali tool usare
4. **Sperimenta**: Prova query ambigue e vedi come Claude le interpreta

## Cosa Osservare

- ⚙️ **Tool Selection**: Claude sceglie il tool giusto?
- 🔄 **Loop Behavior**: Quante iterazioni servono?
- ✅ **Success Rate**: Il task viene completato correttamente?
- 🐛 **Error Handling**: Come gestisce gli errori?

## Domande da Farsi

- Quali tool vengono usati più spesso?
- Ci sono tool che mancano per i tuoi use case?
- Come potresti estendere l'agent per il tuo workflow?
- Quali sono i limiti che hai trovato?

---

Ricorda: **"300 linee di codice in un loop"** - Geoffrey Huntley