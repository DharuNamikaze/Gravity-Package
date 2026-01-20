@echo off
REM Gravity Native Host
REM This script bridges WebSocket (MCP server) and Native Messaging (Chrome extension)

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Start the native host bridge
node "%SCRIPT_DIR%..\dist\native-host.js"
