@echo off
rem 講義レコーダー: ダブルクリックで起動します。
setlocal
cd /d "%~dp0"

rem Running from inside a ZIP puts the files in a read-only temp folder, where
rem npm cannot install anything. Stop with a clear message instead of failing.
echo %~dp0 | findstr /i "\\AppData\\Local\\Temp\\" >nul
if not errorlevel 1 (
  echo.
  echo ZIP ファイルの中から実行しています。
  echo 先に ZIP を右クリックして「すべて展開」してから、
  echo 展開先のフォルダにある start.cmd を実行してください。
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js が見つかりません。https://nodejs.org/ から LTS 版をインストールしてください。
  pause
  exit /b 1
)

if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo .env.local を作成しました。メモ帳で開いて OPENAI_API_KEY を設定してください。
  notepad ".env.local"
)

if not exist "node_modules" (
  echo 初回準備をしています。数分かかります...
  call npm install || goto :error
)

if not exist ".next" (
  echo アプリを準備しています...
  call npm run build || goto :error
)

echo ブラウザで http://localhost:3939 を開きます。
start "" http://localhost:3939
call npm run start
goto :eof

:error
echo.
echo 準備に失敗しました。上のメッセージを確認してください。
pause
