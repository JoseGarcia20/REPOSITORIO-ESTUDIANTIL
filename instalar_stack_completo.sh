#!/bin/bash
set -e

# ============================================================
# INSTALACIÓN COMPLETA - Plataforma Estudiantil Inteligente
# ============================================================
# Ejecutar: chmod +x instalar_stack_completo.sh && ./instalar_stack_completo.sh
# ============================================================

ROJO='\033[0;31m'
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
SIN_COLOR='\033[0m'

info()  { echo -e "${AZUL}[INFO]${SIN_COLOR} $1"; }
exito() { echo -e "${VERDE}[OK]${SIN_COLOR} $1"; }
error() { echo -e "${ROJO}[ERROR]${SIN_COLOR} $1"; }
aviso() { echo -e "${AMARILLO}[AVISO]${SIN_COLOR} $1"; }

ejecutar_comando() {
    if ! "$@" > /tmp/instalacion.log 2>&1; then
        error "Falló: $*"
        tail -20 /tmp/instalacion.log
        exit 1
    fi
}

verificar_comando() {
    if command -v "$1" &> /dev/null; then
        exito "$1 ya instalado ($($1 --version 2>/dev/null | head -1))"
        return 0
    fi
    return 1
}

# ============================================================
# CONFIGURACIÓN INICIAL
# ============================================================
echo ""
echo -e "${AZUL}============================================================${SIN_COLOR}"
echo -e "${AZUL} PLATAFORMA ESTUDIANTIL INTELIGENTE - INSTALACIÓN COMPLETA${SIN_COLOR}"
echo -e "${AZUL}============================================================${SIN_COLOR}"
echo ""

read -rp "Usuario de PostgreSQL [jose]: " DB_USER
DB_USER=${DB_USER:-jose}

read -rsp "Contraseña de PostgreSQL [123456]: " DB_PASS
DB_PASS=${DB_PASS:-123456}
echo ""

read -rp "Nombre de base de datos [plataforma_academica]: " DB_NAME
DB_NAME=${DB_NAME:-plataforma_academica}

read -rp "Correo superadmin [superadmin@plataforma.edu.co]: " SEED_EMAIL
SEED_EMAIL=${SEED_EMAIL:-superadmin@plataforma.edu.co}

read -rsp "Contraseña superadmin [Admin123456]: " SEED_PASS
SEED_PASS=${SEED_PASS:-Admin123456}
echo ""

read -rp "Gemini API Key (opcional, dejar vacío para solo Ollama): " GEMINI_KEY

RUTA_PROYECTO=$(dirname "$(realpath "$0")")
info "Directorio del proyecto: $RUTA_PROYECTO"

# ============================================================
# 1. HERRAMIENTAS BÁSICAS DEL SISTEMA
# ============================================================
echo ""
info "Paso 1/12 - Instalando herramientas básicas del sistema..."
sudo apt update && sudo apt upgrade -y
ejecutar_comando sudo apt install -y curl git build-essential unzip

# ============================================================
# 2. RUST + CARGO
# ============================================================
echo ""
info "Paso 2/12 - Instalando Rust + Cargo..."
if ! verificar_comando rustc; then
    ejecutar_comando curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/rustup-init.sh
    chmod +x /tmp/rustup-init.sh
    /tmp/rustup-init.sh -y
    source "$HOME/.cargo/env"
fi
rustc --version
cargo --version

# ============================================================
# 3. FAST NODE MANAGER (FNM)
# ============================================================
echo ""
info "Paso 3/12 - Instalando Fast Node Manager (fnm)..."
if ! verificar_comando fnm; then
    ejecutar_comando curl -fsSL https://fnm.vercel.app/install -o /tmp/fnm-install.sh
    chmod +x /tmp/fnm-install.sh
    /tmp/fnm-install.sh --skip-shell
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env --use-on-cd --shell bash)"
    if ! grep -q 'fnm' "$HOME/.bashrc"; then
        echo 'export PATH="$HOME/.local/share/fnm:$PATH"' >> "$HOME/.bashrc"
        echo 'eval "$(fnm env --use-on-cd --shell bash)"' >> "$HOME/.bashrc"
    fi
fi

# ============================================================
# 4. NODE.JS 24
# ============================================================
echo ""
info "Paso 4/12 - Instalando Node.js 24..."
if ! fnm list 2>/dev/null | grep -q 'v24'; then
    ejecutar_comando fnm install 24
fi
fnm use 24
fnm default 24
node -v
npm -v

# ============================================================
# 5. NESTJS CLI
# ============================================================
echo ""
info "Paso 5/12 - Instalando NestJS CLI..."
if ! verificar_comando nest; then
    ejecutar_comando npm install -g @nestjs/cli
fi
nest --version

# ============================================================
# 6. POSTGRESQL
# ============================================================
echo ""
info "Paso 6/12 - Instalando PostgreSQL..."
if ! verificar_comando psql; then
    ejecutar_comando sudo apt install -y postgresql postgresql-contrib
fi
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql --no-pager | head -5

info "Creando usuario y base de datos en PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || aviso "El usuario $DB_USER ya existe"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || aviso "La base de datos $DB_NAME ya existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null

# ============================================================
# 7. VARIABLES DE ENTORNO (.env)
# ============================================================
echo ""
info "Paso 7/12 - Configurando variables de entorno (.env)..."
cat > "$RUTA_PROYECTO/.env" << EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
JWT_SECRET="$DB_PASS"
JWT_EXPIRES_IN="8h"
SEED_SUPERADMIN_EMAIL="$SEED_EMAIL"
SEED_SUPERADMIN_DOCUMENTO="0000000001"
SEED_SUPERADMIN_PASSWORD="$SEED_PASS"
AI_RESUMEN_PROVIDER="${GEMINI_KEY:+gemini}"
AI_RESUMEN_PROVIDER="${AI_RESUMEN_PROVIDER:-ollama}"
EOF

if [ -n "$GEMINI_KEY" ]; then
    cat >> "$RUTA_PROYECTO/.env" << EOF
GEMINI_API_KEY="$GEMINI_KEY"
GEMINI_MODEL="gemini-2.5-flash-lite"
GEMINI_FALLBACK_MODELS="gemini-2.0-flash-lite,gemini-2.0-flash"
GEMINI_MAX_ATTEMPTS="3"
GEMINI_RETRY_DELAY_MS="1200"
EOF
fi

cat >> "$RUTA_PROYECTO/.env" << EOF
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:3b"
AI_RESUMEN_MAX_CHARS="18000"
AI_RESUMEN_CHUNK_CHARS="3000"
AI_RESUMEN_MAX_CHUNKS="6"
AI_RESUMEN_NUM_CTX="4096"
AI_RESUMEN_TIMEOUT_MS="120000"
AI_RESUMEN_FALLBACK_EXTRACTIVO="true"
EOF

exito "Archivo .env creado"

# ============================================================
# 8. INSTALAR DEPENDENCIAS BACKEND
# ============================================================
echo ""
info "Paso 8/12 - Instalando dependencias del backend..."
cd "$RUTA_PROYECTO"
npm install

# ============================================================
# 9. PRISMA: GENERAR CLIENTE + MIGRACIONES
# ============================================================
echo ""
info "Paso 9/12 - Configurando Prisma..."
cd "$RUTA_PROYECTO"
npx prisma generate
npx prisma migrate deploy

# ============================================================
# 10. SEED DE BASE DE DATOS
# ============================================================
echo ""
info "Paso 10/12 - Poblando base de datos (seed)..."
cd "$RUTA_PROYECTO"
SEED_SUPERADMIN_EMAIL="$SEED_EMAIL" \
SEED_SUPERADMIN_PASSWORD="$SEED_PASS" \
npm run db:seed

# ============================================================
# 11. DIRECTORIOS DE ARCHIVOS
# ============================================================
echo ""
info "Paso 11/12 - Creando directorios para subida de archivos..."
mkdir -p "$RUTA_PROYECTO/uploads/instituciones"
mkdir -p "$RUTA_PROYECTO/uploads/recursos"
mkdir -p "$RUTA_PROYECTO/uploads/aula-colaborativa"
mkdir -p "$RUTA_PROYECTO/uploads/recursos/ia-clases"

# ============================================================
# 12. FRONTEND
# ============================================================
echo ""
info "Instalando dependencias del frontend..."
cd "$RUTA_PROYECTO/frontend"
npm install

# ============================================================
# 13. OLLAMA (OPCIONAL)
# ============================================================
echo ""
info "Paso 13/12 - Instalando Ollama (IA local)..."
if ! command -v ollama &> /dev/null; then
    ejecutar_comando curl -fsSL https://ollama.com/install.sh -o /tmp/ollama-install.sh
    chmod +x /tmp/ollama-install.sh
    /tmp/ollama-install.sh
fi

info "Descargando modelo qwen2.5:3b (puede tomar varios minutos)..."
ollama pull qwen2.5:3b 2>&1 || aviso "No se pudo descargar el modelo. Se puede hacer manual luego con: ollama pull qwen2.5:3b"

# ============================================================
# 14. COMPILAR BACKEND (VERIFICACIÓN)
# ============================================================
echo ""
info "Compilando backend (verificación)..."
cd "$RUTA_PROYECTO"
npm run build

# ============================================================
# FIN
# ============================================================
echo ""
echo -e "${VERDE}============================================================${SIN_COLOR}"
echo -e "${VERDE} INSTALACIÓN COMPLETA EXITOSA${SIN_COLOR}"
echo -e "${VERDE}============================================================${SIN_COLOR}"
echo ""
echo -e "${AZUL}Para iniciar la aplicación:${SIN_COLOR}"
echo ""
echo "  Terminal 1 - Backend:"
echo "    cd $RUTA_PROYECTO && npm run start:dev"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd $RUTA_PROYECTO/frontend && npm run dev"
echo ""
echo -e "${AZUL}Accesos:${SIN_COLOR}"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo ""
echo -e "${AZUL}Usuario inicial:${SIN_COLOR}"
echo "  Correo:    $SEED_EMAIL"
echo "  Contraseña: $SEED_PASS"
echo ""
echo -e "${AMARILLO}Si usas Ollama, asegúrate de que esté corriendo:${SIN_COLOR}"
echo "  ollama serve"
echo ""
