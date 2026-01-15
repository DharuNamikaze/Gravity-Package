@echo off
REM Gravity Native Host
REM This script handles native messaging between Chrome extension and the Gravity MCP server

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Start the Gravity MCP server
node "%SCRIPT_DIR%..\dist\cli.js"
