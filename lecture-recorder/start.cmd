@echo off
rem Lecture Recorder launcher. Double-click to start the app.
rem The console defaults to a Western codepage, which turns Japanese into
rem mojibake, so switch it to UTF-8 first. Every message is also written in
rem English in case the switch does not take effect on an older console.
chcp 65001 >nul 2>nul
setlocal
cd /d "%~dp0"
title Lecture Recorder

rem Running from inside a ZIP puts the files in a read-only temp folder, where
rem npm cannot install anything. Stop with a clear message instead of failing.
set "HERE=%~dp0"
if /i not "%HERE:AppData\Local\Temp=%"=="%HERE%" (
  echo.
  echo [!] ZIP の中から実行しています / Running from inside the ZIP file.
  echo     ZIP を右クリックして「すべて展開」してから、展開先の start.cmd を実行してください。
  echo     Right-click the ZIP, choose "Extract all", then run start.cmd from the extracted folder.
  echo.
  pause
  exit /b 1
)

rem Already running? Just bring up the browser. Double-clicking the shortcut a
rem second time should not start a second server and fail on a taken port.
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try{$c.Connect('127.0.0.1',3939); exit 0}catch{exit 1}finally{$c.Dispose()}" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo すでに起動しています。ブラウザを開きます。
  echo Already running. Opening the browser.
  start "" http://localhost:3939
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [!] Node.js が見つかりません / Node.js was not found.
  echo     https://nodejs.org/ から LTS 版をインストールしてください。
  echo     Install the LTS version from https://nodejs.org/ and run this again.
  echo.
  pause
  exit /b 1
)

if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo.
  echo [1/4] .env.local を作成しました。メモ帳で OPENAI_API_KEY を設定してください。
  echo       Created .env.local. Paste your OpenAI key after OPENAI_API_KEY= then save and close Notepad.
  echo.
  notepad ".env.local"
)

if not exist "node_modules" (
  echo.
  echo [2/4] 初回準備をしています。5 分ほどかかります。警告が出ても問題ありません。
  echo       First-time setup. This takes a few minutes. Warnings during this step are normal.
  echo.
  call npm install || goto :error
)

if not exist ".next" (
  echo.
  echo [3/4] アプリを準備しています。1 分ほどかかります。
  echo       Building the app. About one minute.
  echo.
  call npm run build || goto :error
)

echo.
echo [4/4] 起動しました。ブラウザで http://localhost:3939 を開きます。
echo       Ready. Opening http://localhost:3939 in your browser.
echo.
echo       この黒い画面は閉じないでください。これがアプリ本体です。
echo       Keep this window open. It is the app itself.
echo.
start "" http://localhost:3939
call npm run start
goto :eof

:error
echo.
echo [!] 準備に失敗しました。上のメッセージを確認してください。
echo     Setup failed. Check the messages above.
echo.
pause
