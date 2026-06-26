@echo off
REM Script para iniciar servidor local en Windows
REM Abre http://localhost:5500 automáticamente

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Sistema de Convalidaciones USIL - Servidor Local          ║
echo ║  Puerto: 5500                                               ║
echo ║  URL: http://localhost:5500                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Python detectado
    echo.
    echo Iniciando servidor Python...
    echo.
    python -m http.server 5500
) else (
    echo [✗] Python no detectado
    echo.
    echo Opción 1: Instalar Python desde https://python.org
    echo Opción 2: Usar Node.js:
    echo   1. npm install -g serve
    echo   2. serve -p 5500
    echo Opción 3: Usar VS Code Live Server extension
    echo.
    pause
)
