#!/bin/bash

# ================================================
# Script: setup-ssh-github.sh
# Descripción: Genera clave SSH y guía para GitHub
# ================================================

set -e  # Detiene el script si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="
echo -e "   GUÍA AUTOMATIZADA: Configurar SSH para GitHub"
echo -e "==================================================${NC}\n"

# 1. Verificar si git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git no está instalado.${NC}"
    echo -e "   Instalalo con: sudo apt install git (Ubuntu/Debian)"
    echo -e "   o: brew install git (macOS)"
    exit 1
fi

# 2. Verificar si ssh-keygen está disponible
if ! command -v ssh-keygen &> /dev/null; then
    echo -e "${RED}❌ ssh-keygen no encontrado.${NC}"
    exit 1
fi

# 3. Verificar si ya existe una clave SSH
echo -e "${YELLOW}🔍 Verificando claves SSH existentes...${NC}"
if ls ~/.ssh/id_* 2>/dev/null | grep -q "id_"; then
    echo -e "${GREEN}✅ Ya existe una clave SSH:${NC}"
    ls -la ~/.ssh/id_* 2>/dev/null | awk '{print $9}'
    echo ""
    read -p "¿Querés generar una nueva clave? (s/N): " generar_nueva
    if [[ ! "$generar_nueva" =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}📋 Usando clave existente.${NC}"
        CLAVE_EXISTENTE=true
    fi
fi

# 4. Generar nueva clave si es necesario
if [ -z "$CLAVE_EXISTENTE" ]; then
    echo -e "${YELLOW}🔑 Generando nueva clave SSH...${NC}"
    read -p "Email para la clave (ej: tu@email.com): " email
    if [ -z "$email" ]; then
        echo -e "${RED}❌ Email requerido.${NC}"
        exit 1
    fi
    
    # Crear directorio .ssh si no existe
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Generar clave
    ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
    
    echo -e "${GREEN}✅ Clave generada en: ~/.ssh/id_ed25519${NC}"
    CLAVE_PATH="~/.ssh/id_ed25519"
else
    # Usar clave existente
    CLAVE_EXISTENTE_FILE=$(ls ~/.ssh/id_* 2>/dev/null | grep -v ".pub" | head -1)
    CLAVE_PATH="$CLAVE_EXISTENTE_FILE"
fi

# 5. Iniciar agente SSH y agregar clave
echo -e "\n${YELLOW}🚀 Iniciando agente SSH...${NC}"
eval "$(ssh-agent -s)" > /dev/null
ssh-add ${CLAVE_PATH/#\~/~} 2>/dev/null || ssh-add ~/.ssh/id_ed25519 2>/dev/null
echo -e "${GREEN}✅ Clave agregada al agente SSH${NC}"

# 6. Mostrar clave pública
CLAVE_PUB="${CLAVE_PATH}.pub"
if [ -f "${CLAVE_PUB/#\~/~}" ] || [ -f ~/.ssh/id_ed25519.pub ]; then
    echo -e "\n${BLUE}=================================================="
    echo -e "   📋 COPIA ESTA CLAVE SSH PÚBLICA"
    echo -e "==================================================${NC}\n"
    
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        cat ~/.ssh/id_ed25519.pub
    else
        cat "${CLAVE_PUB/#\~/~}"
    fi
    
    echo -e "\n${BLUE}==================================================${NC}"
fi

# 7. Instrucciones para GitHub
echo -e "\n${GREEN}📌 PASOS PARA AGREGAR LA CLAVE EN GITHUB:${NC}"
echo -e "   ${YELLOW}1.${NC} Abrí https://github.com/settings/keys"
echo -e "   ${YELLOW}2.${NC} Click en ${GREEN}'New SSH key'${NC}"
echo -e "   ${YELLOW}3.${NC} Title: Nombre descriptivo (ej: 'Mi notebook')"
echo -e "   ${YELLOW}4.${NC} Key type: ${GREEN}Authentication Key${NC}"
echo -e "   ${YELLOW}5.${NC} Pegá la clave que aparece arriba"
echo -e "   ${YELLOW}6.${NC} Click en ${GREEN}'Add SSH key'${NC}"

# 8. Verificar conexión
echo -e "\n${YELLOW}🔌 ¿Querés verificar la conexión SSH con GitHub? (s/N): ${NC}"
read verificar
if [[ "$verificar" =~ ^[Ss]$ ]]; then
    echo -e "\n${YELLOW}Probando conexión...${NC}"
    ssh -T git@github.com
fi

# 9. Clonar repositorio
echo -e "\n${YELLOW}📦 ¿Querés clonar un repositorio? (s/N): ${NC}"
read clonar
if [[ "$clonar" =~ ^[Ss]$ ]]; then
    read -p "URL SSH del repositorio (ej: git@github.com:usuario/repo.git): " repo_url
    if [ -n "$repo_url" ]; then
        read -p "Carpeta destino (dejá vacío para usar el nombre del repo): " destino
        if [ -z "$destino" ]; then
            git clone "$repo_url"
        else
            git clone "$repo_url" "$destino"
        fi
        echo -e "${GREEN}✅ Repositorio clonado correctamente${NC}"
    fi
fi

echo -e "\n${GREEN}✅ ¡Configuración completada!${NC}"
