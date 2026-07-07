@echo off
echo ============================================
echo   Proyecto Redes - Configuracion Inicial
echo ============================================
echo.

REM ============================================
REM 1. Verificar Node.js
REM ============================================
echo [1/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo desde: https://nodejs.org/ (version 18 o superior)
    pause
    exit /b 1
)
echo Node.js encontrado: 
node --version

REM ============================================
REM 2. Configurar archivo .env
REM ============================================
echo.
echo [2/5] Configurando archivo .env...
if not exist server\.env (
    copy server\.env.example server\.env
    echo Archivo .env creado desde .env.example
    echo IMPORTANTE: Edita server\.env y configura AI_ACCESS_CODE y JWT_SECRET
) else (
    echo .env ya existe, se conserva el actual
)

REM ============================================
REM 3. Instalar dependencias
REM ============================================
echo.
echo [3/5] Instalando dependencias del servidor...
cd server
call npm install
cd ..

echo.
echo [4/5] Instalando dependencias del cliente...
cd client
call npm install
cd ..

REM ============================================
REM 4. Verificar/Instalar Ollama
REM ============================================
echo.
echo [5/5] Verificando Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ollama no esta instalado.
    echo.
    echo Opcion 1: Instalacion manual
    echo   Descarga Ollama desde: https://ollama.com/download
    echo   Ejecuta el instalador y luego vuelve a ejecutar este script.
    echo.
    echo Opcion 2: Usar Docker (recomendado)
    echo   docker compose up -d ollama
    echo.
    pause
    exit /b 0
) else (
    echo Ollama encontrado: 
    ollama --version
    
    REM Verificar si el modelo esta descargado
    echo.
    echo Verificando modelo...
    ollama list | findstr "qwen2-math" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo Descargando modelo qwen2-math...
        ollama pull qwen2-math
    ) else (
        echo Modelo qwen2-math ya esta descargado
    )
)

REM ============================================
REM 5. Iniciar proyecto
REM ============================================
echo.
echo ============================================
echo   Configuracion completada!
echo ============================================
echo.
echo Para iniciar el proyecto:
echo.
echo   1. Asegurate de que Ollama este corriendo
echo      (Inicia "Ollama" desde el menu de inicio)
echo.
echo   2. En una terminal, inicia el servidor:
echo      cd server ^&^& npm start
echo.
echo   3. En otra terminal, inicia el cliente:
echo      cd client ^&^& npm run dev
echo.
echo   4. Abre http://localhost:5173 en tu navegador
echo.
pause
