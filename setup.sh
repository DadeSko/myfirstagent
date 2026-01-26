#!/bin/bash

# 🚀 Setup Script per il Tuo Primo Agent
# Seguendo Geoffrey Huntley's metodologia

echo "🤖 Setup del Primo Agent di Davide"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installalo da https://nodejs.org"
    exit 1
fi

echo "✅ Node.js trovato: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm non trovato"
    exit 1
fi

echo "✅ npm trovato: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installazione dipendenze..."
npm install

echo ""
echo "🔑 Configurazione API Key..."
echo ""

# Create .env if doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ File .env creato"
    echo ""
    echo "⚠️  IMPORTANTE: Modifica il file .env e inserisci la tua ANTHROPIC_API_KEY"
    echo "   Ottieni la tua key da: https://console.anthropic.com/settings/keys"
    echo ""
else
    echo "✅ File .env già esistente"
fi

echo ""
echo "✨ Setup completato!"
echo ""
echo "📚 Prossimi passi:"
echo "   1. Modifica .env con la tua API key"
echo "   2. Esporta la key: export ANTHROPIC_API_KEY='your-key'"
echo "   3. Prova l'agent: ts-node agent.ts 'Lista tutti i file'"
echo ""
echo "📖 Leggi README.md per più esempi"
echo "🏗️  Leggi ARCHITECTURE.md per capire come funziona"
echo "🧪 Leggi EXAMPLES.md per test cases"
echo ""
echo "🎯 Ricorda Geoffrey Huntley:"
echo '   "300 linee di codice in un loop con LLM tokens"'
echo ""
echo "🚀 Go forward and build!"
