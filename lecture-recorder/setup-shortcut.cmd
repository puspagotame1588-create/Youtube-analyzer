@echo off
rem デスクトップにショートカットを作ります。ダブルクリックで実行してください。
chcp 65001 >nul 2>nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-shortcut.ps1"
