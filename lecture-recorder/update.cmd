@echo off
rem 最新版に更新します。ダブルクリックで実行してください。
rem Updates the app to the latest version. Double-click to run.
rem
rem 更新はアプリのフォルダごと入れ替えます。update.ps1 自身もその対象なので、
rem TEMP にコピーしてから実行します。実行中のファイルは上書きできないためです。
chcp 65001 >nul 2>nul
cd /d "%~dp0"
title 講義レコーダー - 更新

if not exist "%~dp0update.ps1" (
  echo.
  echo [!] update.ps1 が見つかりません / update.ps1 is missing from this folder.
  echo.
  pause
  exit /b 1
)

copy /y "%~dp0update.ps1" "%TEMP%\lecrec-update.ps1" >nul
rem 引数の末尾に . を足しているのは、"%~dp0" の末尾の \ が
rem 閉じ引用符を打ち消してしまうのを避けるためです。
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\lecrec-update.ps1" "%~dp0."
del "%TEMP%\lecrec-update.ps1" >nul 2>nul
