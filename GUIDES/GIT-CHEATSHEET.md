# 🎯 Git Quick Reference - Comandi Essenziali

Cheat sheet veloce per gestire il tuo repository GitHub.

---

## 🚀 Setup Iniziale (Una Volta Sola)

```bash
# Inizializza repository
git init

# Configura il tuo nome (se non l'hai mai fatto)
git config --global user.name "Tuo Nome"
git config --global user.email "tua@email.com"

# Collega al repository GitHub
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Verifica remote
git remote -v
```

---

## 📝 Workflow Quotidiano

### 1. Controlla lo Status

```bash
# Vedi cosa è cambiato
git status

# Vedi le differenze nel dettaglio
git diff
```

### 2. Aggiungi Modifiche

```bash
# Aggiungi tutto
git add .

# Aggiungi file specifico
git add agent.ts

# Aggiungi più file
git add agent.ts README.md
```

### 3. Commit

```bash
# Commit con messaggio
git commit -m "✨ Add new feature"

# Commit con messaggio multi-linea
git commit -m "✨ Add search tool

- Implement ripgrep integration
- Add search_tool.ts
- Update documentation"
```

### 4. Push su GitHub

```bash
# Push (dopo il primo push -u)
git push

# Primo push (solo la prima volta)
git push -u origin main
```

---

## 🔄 Comandi Comuni

### Vedere la History

```bash
# Log semplice
git log

# Log compatto (meglio)
git log --oneline

# Log con grafo
git log --oneline --graph --all

# Ultimi 5 commit
git log --oneline -5
```

### Annullare Modifiche

```bash
# Scarta modifiche in un file (NON committato)
git checkout -- agent.ts

# Scarta TUTTE le modifiche (NON committate)
git checkout .

# Rimuovi file dall'area di staging (ma mantieni modifiche)
git reset agent.ts

# Torna al commit precedente (ATTENZIONE!)
git reset --hard HEAD~1
```

### Rimuovere File

```bash
# Rimuovi file dal repository E dal filesystem
git rm agent.ts

# Rimuovi dal repository ma MANTIENI nel filesystem
git rm --cached .env

# Commit la rimozione
git commit -m "🗑️ Remove file"
```

---

## 🌿 Branching (Avanzato)

```bash
# Crea nuovo branch
git branch feature-search

# Passa a un branch
git checkout feature-search

# Crea E passa a nuovo branch
git checkout -b feature-search

# Lista tutti i branch
git branch

# Merge branch in main
git checkout main
git merge feature-search

# Cancella branch
git branch -d feature-search
```

---

## 🔍 Comandi Utili

### Vedere Differenze

```bash
# Differenze non staged
git diff

# Differenze staged
git diff --cached

# Differenze in file specifico
git diff agent.ts
```

### Cercare nel Codice

```bash
# Cerca "function" in tutti i file
git grep "function"

# Cerca solo in file .ts
git grep "function" -- "*.ts"
```

### Informazioni

```bash
# Chi ha modificato ogni riga
git blame agent.ts

# Info su commit specifico
git show <commit-hash>
```

---

## 🆘 Emergenze

### Ho committato .env per errore!

```bash
# 1. Rimuovi dal tracking
git rm --cached .env

# 2. Aggiungi al .gitignore se non c'è già
echo ".env" >> .gitignore

# 3. Commit
git commit -m "🔒 Remove .env from tracking"

# 4. Push
git push

# 5. IMPORTANTE: Rigenera la API key!
```

### Ho fatto commit sbagliato

```bash
# Annulla ultimo commit (mantieni modifiche)
git reset --soft HEAD~1

# Annulla ultimo commit (ELIMINA modifiche)
git reset --hard HEAD~1
```

### Ho pushato per errore

```bash
# Annulla ultimo commit su GitHub (ATTENZIONE!)
git reset --hard HEAD~1
git push --force
```

---

## 📊 Emoji per Commit Messages

| Emoji | Code | Uso |
|-------|------|-----|
| 🎉 | `:tada:` | Initial commit |
| ✨ | `:sparkles:` | New feature |
| 🐛 | `:bug:` | Bug fix |
| 📝 | `:memo:` | Documentation |
| ♻️ | `:recycle:` | Refactoring |
| 🔧 | `:wrench:` | Config files |
| 🚀 | `:rocket:` | Deploy |
| 🔒 | `:lock:` | Security |
| 🗑️ | `:wastebasket:` | Remove code/files |
| 🎨 | `:art:` | Improve structure |

---

## ✅ Checklist Prima di Push

```bash
# 1. Verifica status
git status

# 2. Verifica che .env NON sia incluso
# Se vedi .env in "Changes to be committed", FERMATI!

# 3. Vedi cosa stai per committare
git diff --cached

# 4. Se tutto ok, commit
git commit -m "Message"

# 5. Push
git push
```

---

## 🎯 Pattern Comune: Feature Development

```bash
# 1. Crea branch per feature
git checkout -b add-search-tool

# 2. Lavora, commit spesso
git add .
git commit -m "🚧 WIP: search tool"

# 3. Quando finito
git add .
git commit -m "✨ Complete search tool implementation"

# 4. Torna a main
git checkout main

# 5. Merge
git merge add-search-tool

# 6. Push
git push

# 7. Cancella branch (opzionale)
git branch -d add-search-tool
```

---

## 📱 Comandi da Mobile (GitHub.com)

Se sei su mobile e vuoi fare modifiche veloci:

1. Vai su github.com/your-repo
2. Naviga al file
3. Click su icona matita (✏️)
4. Modifica
5. Commit direttamente da web

---

## 🔗 Collegamenti Utili

- [Git Cheat Sheet PDF](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [Gitmoji](https://gitmoji.dev)

---

## 💡 Pro Tips

1. **Commit spesso**: Meglio tanti piccoli commit che uno gigante
2. **Message chiari**: "Fix bug" è male, "🐛 Fix tool execution error in bash_tool" è bene
3. **Usa branch**: Per features grandi, usa branch separati
4. **Pull prima di push**: Se lavori con altri, `git pull` prima di `git push`
5. **Non committare segreti**: Mai .env, mai API keys
6. **.gitignore presto**: Aggiungilo nel primo commit

---

## ⚡ Shortcuts

```bash
# Status
git st  # (dopo: git config --global alias.st status)

# Commit rapido
git commit -am "Message"  # Add + Commit in uno (solo per file già tracked)

# Log compatto
git lg  # (dopo: git config --global alias.lg "log --oneline --graph")
```

---

**Keep calm and commit on!** 🚀