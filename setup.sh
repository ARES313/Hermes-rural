#!/bin/bash
set -e

echo "============================================"
echo "  Proyecto Redes - Configuracion Inicial"
echo "============================================"
echo ""

# ============================================
# 1. Verificar Node.js
# ============================================
echo "[1/5] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no esta instalado."
    echo "Instalalo con:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  O descarga desde: https://nodejs.org/"
    exit 1
fi
echo "Node.js encontrado: $(node --version)"

# ============================================
# 2. Configurar archivo .env
# ============================================
echo ""
echo "[2/5] Configurando archivo .env..."
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "Archivo .env creado desde .env.example"
    echo "IMPORTANTE: Edita server/.env y configura AI_ACCESS_CODE y JWT_SECRET"
else
    echo ".env ya existe, se conserva el actual"
fi

# ============================================
# 3. Instalar dependencias
# ============================================
echo ""
echo "[3/5] Instalando dependencias del servidor..."
cd server
npm install
cd ..

echo ""
echo "[4/5] Instalando dependencias del cliente..."
cd client
npm install
cd ..

# ============================================
# 4. Verificar/Instalar Ollama
# ============================================
echo ""
echo "[5/5] Verificando Ollama..."
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "Ollama no esta instalado."
    echo ""
    echo "Opcion 1: Instalacion automatica"
    echo "  curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    echo "Opcion 2: Usar Docker (recomendado)"
    echo "  docker compose up -d ollama"
    echo ""
    echo "Despues de instalar, ejecuta:"
    echo "  ollama pull qwen2-math"
    echo ""
    echo "Luego vuelve a ejecutar este script."
    exit 0
else
    echo "Ollama encontrado: $(ollama --version)"
    
    # Check if model is downloaded
    echo ""
    echo "Verificando modelo..."
    if ollama list | grep -q "qwen2-math"; then
        echo "Modelo qwen2-math ya esta descargado"
    else
        echo "Descargando modelo qwen2-math..."
        ollama pull qwen2-math
    fi
fi

# ============================================
# 5. Mensaje final
# ============================================
echo ""
echo "============================================"
echo "  Configuracion completada!"
echo "============================================"
echo ""
echo "Para iniciar el proyecto:"
echo ""
echo "  1. Asegurate de que Ollama este corriendo:"
echo "     ollama serve"
echo ""
echo "  2. En otra terminal, inicia el servidor:"
echo "     cd server && npm start"
echo ""
echo "  3. En otra terminal, inicia el cliente:"
echo "     cd client && npm run dev"
echo ""
echo "  4. Abre http://localhost:5173 en tu navegador"
echo ""
echo "O con Docker (si lo prefieres):"
echo "  docker compose up --build"
echo ""
