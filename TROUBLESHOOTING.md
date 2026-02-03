# Troubleshooting Guide

## 🚨 Guida al Troubleshooting

Una guida completa per diagnosticare e risolvere problemi comuni nel nostro ambiente di sviluppo.

## 🎯 Metodologia di Troubleshooting

### Approccio Sistematico (5W + H)

1. **What** - Cosa sta succedendo?
2. **When** - Quando si verifica il problema?
3. **Where** - Dove si manifesta?
4. **Who** - Chi è coinvolto/chi può aiutare?
5. **Why** - Perché sta succedendo?
6. **How** - Come possiamo risolverlo?

## 🔧 Problemi Comuni e Soluzioni

### 1. Problemi di Installazione e Dipendenze

#### Sintomi
```bash
# Errori tipici:
npm ERR! Cannot resolve dependency
Module not found: Error: Can't resolve 'package-name'
npm WARN peer dep missing
```

#### Diagnosi
```bash
# Controlla package.json
read_file("package.json")

# Verifica installazioni
bash("npm ls")

# Controlla versioni Node/npm
bash("node --version")
bash("npm --version")

# Verifica cache npm
bash("npm cache verify")
```

#### Soluzioni
```bash
# Pulisci e reinstalla
bash("rm -rf node_modules package-lock.json")
bash("npm cache clean --force")
bash("npm install")

# Aggiorna npm
bash("npm install -g npm@latest")

# Risolvi conflitti peer dependencies
bash("npm install --legacy-peer-deps")
```

### 2. Problemi di Build e Compilazione

#### Sintomi
```bash
# Errori tipici:
Syntax Error: Unexpected token
Module build failed
Cannot find module
```

#### Diagnosi
```bash
# Trova file di configurazione
code_search("webpack|babel|tsconfig")

# Controlla configurazione build
read_file("webpack.config.js")
read_file("babel.config.js")
read_file("tsconfig.json")

# Verifica script npm
bash("npm run build -- --verbose")
```

#### Soluzioni
```bash
# Pulisci build precedente
bash("npm run clean")
bash("rm -rf build/ dist/")

# Build con debug
bash("NODE_ENV=development npm run build")

# Controlla sintassi file specifici
bash("node -c suspicious-file.js")
```

### 3. Problemi di Runtime

#### Sintomi
```bash
# Errori tipici:
ReferenceError: variable is not defined
TypeError: Cannot read property 'x' of undefined
Promise rejection unhandled
```

#### Diagnosi
```bash
# Trova errore specifico
code_search("error message text")

# Controlla console logs
code_search("console\\.log|console\\.error")

# Verifica async/await usage
code_search("async|await")

# Controlla gestione errori
code_search("try|catch|throw")
```

#### Soluzioni
```bash
# Aggiungi logging dettagliato
edit_file(
  path="problematic-file.js",
  old_str="function problematicFunction() {",
  new_str="function problematicFunction() {\n  console.log('🔍 Debugging:', arguments);"
)

# Test in isolamento
bash("node -e \"require('./problematic-file.js')\"")
```

### 4. Problemi di Rete e API

#### Sintomi
```bash
# Errori tipici:
ECONNREFUSED
CORS error
Timeout
504 Gateway Timeout
```

#### Diagnosi
```bash
# Test connettività
bash("ping api-server.com")
bash("curl -I http://localhost:3000/api/health")

# Controlla porte in uso
bash("netstat -tulpn | grep :3000")

# Verifica variabili ambiente
bash("env | grep -i api")

# Trova configurazioni API
code_search("baseURL|apiUrl|endpoint")
```

#### Soluzioni
```bash
# Test endpoint manualmente
bash("curl -v http://localhost:3000/api/test")

# Controlla CORS settings
code_search("cors|Access-Control")

# Verifica proxy settings
read_file("package.json") # sezione "proxy"
```

### 5. Problemi di Testing

#### Sintomi
```bash
# Errori tipici:
Test suite failed to run
Cannot find module in test
Timeout in test
```

#### Diagnosi
```bash
# Trova configurazione test
read_file("jest.config.js")
read_file("package.json") # sezione "jest"

# Controlla setup test
code_search("setupTests|test setup")

# Verifica mocks
code_search("jest\\.mock|__mocks__")
```

#### Soluzioni
```bash
# Esegui test specifici
bash("npm test -- --testNamePattern=\"test name\"")

# Debug test
bash("npm test -- --detectOpenHandles --forceExit")

# Pulisci cache Jest
bash("npm test -- --clearCache")
```

## 🔍 Strategie di Debug Avanzate

### Debug con Logging Strategico

```javascript
// Template di logging efficace
const debugLog = (label, data) => {
  console.log(`🔍 ${label}:`, JSON.stringify(data, null, 2));
};

// Nei punti critici:
debugLog('Function Input', { param1, param2 });
debugLog('Before API Call', { url, payload });
debugLog('API Response', response.data);
debugLog('Function Output', result);
```

### Analisi Performance

```bash
# Profiling memoria
bash("node --inspect --max-old-space-size=4096 app.js")

# Analisi bundle size
bash("npm run build -- --analyze")

# Monitor risorse
bash("top -p $(pgrep node)")
```

### Debug Network

```bash
# Sniffing traffico
bash("tcpdump -i lo0 port 3000")

# Analisi richieste HTTP
bash("curl -w \"@curl-format.txt\" -o /dev/null -s http://localhost:3000")
```

## 🛠️ Toolkit di Emergenza

### Comandi di Ripristino Rapido

```bash
# Reset completo dipendenze
emergency_deps_reset() {
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
}

# Reset Git (attenzione!)
emergency_git_reset() {
  git stash
  git reset --hard HEAD
  git clean -fd
}

# Backup configurazioni importanti
backup_configs() {
  cp package.json package.json.backup
  cp .env .env.backup
  cp -r config/ config.backup/
}
```

### Health Check Rapido

```bash
# Script di verifica sistema
system_health_check() {
  echo "📊 System Health Check"
  echo "Node version: $(node --version)"
  echo "NPM version: $(npm --version)"
  echo "Git status: $(git status --porcelain | wc -l) modified files"
  echo "Disk space: $(df -h . | tail -1 | awk '{print $4}') available"
  echo "Memory: $(free -h | grep '^Mem:' | awk '{print $7}') available"
}
```

## 📋 Checklist di Troubleshooting

### Pre-Debug Checklist
- [ ] Problema riproducibile?
- [ ] Messaggi di errore completi raccolti?
- [ ] Ultima modifica identificata?
- [ ] Environment verificato (dev/staging/prod)?
- [ ] Dipendenze aggiornate di recente?

### Durante il Debug
- [ ] Ipotesi formulata?
- [ ] Test case creato?
- [ ] Logging aggiunto nei punti critici?
- [ ] Variabili di ambiente verificate?
- [ ] Documentazione consultata?

### Post-Fix Checklist
- [ ] Fix testato in isolamento?
- [ ] Regressioni verificate?
- [ ] Logging di debug rimosso?
- [ ] Documentazione aggiornata?
- [ ] Team informato del fix?

## 🚀 Esempi di Troubleshooting Completi

### Esempio 1: App non si avvia

```bash
# 1. Diagnosi iniziale
bash("npm start 2>&1 | head -20")

# 2. Verifica porta
bash("lsof -i :3000")

# 3. Controlla configurazione
read_file("package.json")

# 4. Test start script
bash("node src/index.js")

# 5. Soluzione: porta occupata
bash("kill $(lsof -ti:3000)")
bash("npm start")
```

### Esempio 2: Test che falliscono

```bash
# 1. Esegui test con verbose
bash("npm test -- --verbose")

# 2. Identifica test fallito
code_search("describe.*failing test")

# 3. Leggi file di test
read_file("tests/failing-test.spec.js")

# 4. Controlla mocks
code_search("jest\\.mock", path="tests/")

# 5. Debug test specifico
bash("npm test -- --testNamePattern=\"specific test\"")
```

### Esempio 3: Build lento

```bash
# 1. Analizza tempo build
bash("time npm run build")

# 2. Controlla webpack config
read_file("webpack.config.js")

# 3. Analizza bundle
bash("npm run build -- --analyze")

# 4. Identifica bottlenecks
code_search("import.*node_modules")

# 5. Ottimizza imports
# Sostituisci import completi con import specifici
```

## 📚 Risorse e Riferimenti

### Tool di Debug Raccomandati

- **Chrome DevTools**: Debug frontend
- **Node.js Inspector**: Debug backend
- **React DevTools**: Debug React apps
- **Redux DevTools**: Debug state management
- **Lighthouse**: Performance analysis

### Command Line Utilities

```bash
# Process monitoring
htop
ps aux | grep node

# Network analysis
netstat -an | grep LISTEN
ss -tulpn

# File system
du -sh * | sort -hr
find . -name "*.log" -size +100M
```

### Log Analysis

```bash
# Grep patterns utili
grep -r "ERROR" logs/
tail -f logs/app.log | grep -i error
awk '/ERROR/{print $0}' logs/app.log

# JSON log parsing
cat logs/app.log | jq '.level' | sort | uniq -c
```

## 🏆 Best Practices

### Prevenzione

1. **Monitoring proattivo**
2. **Testing automatizzato**
3. **Code review rigorosi**
4. **Documentazione aggiornata**
5. **Backup regolari**

### Durante il Debug

1. **Documenta il processo**
2. **Testa una cosa alla volta**
3. **Usa versioning per rollback**
4. **Coinvolgi il team quando necessario**
5. **Non fare fix casuali**

### Post-Resolution

1. **Crea test per prevenire regressioni**
2. **Aggiorna documentazione**
3. **Condividi la soluzione**
4. **Rifletti su cosa ha causato il problema**
5. **Migliora processi per prevenzione futura**