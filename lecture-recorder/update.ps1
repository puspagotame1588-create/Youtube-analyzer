# 最新版に更新します。直接ではなく update.cmd をダブルクリックしてください。
# Updates the app in place. Run update.cmd, not this file.
#
# ZIP を手で落として展開し直す手間をなくすためのものです。録音・書き起こし・
# ノートは別のフォルダ (LECTURE_DATA_DIR) にあるので、更新しても消えません。
# API キーを書いた .env.local もリポジトリに無いため、上書きされません。
#
# update.cmd はこのファイルを TEMP にコピーしてから実行します。そうしないと、
# 自分自身を入れ替える段階で Windows のファイルロックに当たります。

param([Parameter(Mandatory = $true)][string]$AppDir)

$ErrorActionPreference = "Stop"
$here = (Resolve-Path $AppDir).Path
$branch = "claude/japanese-lecture-recorder-ou30c8"
$zipUrl = "https://github.com/puspagotame1588-create/Youtube-analyzer/archive/refs/heads/$branch.zip"

function Fail($ja, $en) {
  Write-Host ""
  Write-Host "[!] $ja"
  Write-Host "    $en"
  Write-Host ""
  Read-Host "Enter キーで終了 / Press Enter to close"
  exit 1
}

if (-not (Test-Path (Join-Path $here "start.cmd"))) {
  Fail "アプリのフォルダが見つかりません。" "Could not find the app folder (no start.cmd in $here)."
}
Set-Location $here

# 起動中のまま上書きすると、使用中のファイルで失敗します。先に止めてもらいます。
$client = New-Object Net.Sockets.TcpClient
try { $client.Connect("127.0.0.1", 3939); $running = $true }
catch { $running = $false }
finally { $client.Dispose() }
if ($running) {
  Fail "アプリが起動中です。黒い画面を閉じてから、もう一度実行してください。" `
       "The app is running. Close its console window, then run this again."
}

$work = Join-Path $env:TEMP ("lecrec-update-" + [Guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $work -Force | Out-Null

try {
  Write-Host ""
  Write-Host "[1/4] 最新版をダウンロードしています… / Downloading the latest version…"
  # PowerShell 5.1 は既定で TLS 1.2 を使わないことがあり、GitHub に繋がりません。
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $zip = Join-Path $work "source.zip"
  # 進捗バーを止めると、大きいファイルでも目に見えて速くなります。
  $previous = $ProgressPreference
  $ProgressPreference = "SilentlyContinue"
  try { Invoke-WebRequest -Uri $zipUrl -OutFile $zip -UseBasicParsing }
  finally { $ProgressPreference = $previous }

  Write-Host "[2/4] 展開しています… / Extracting…"
  $unpacked = Join-Path $work "unpacked"
  Expand-Archive -Path $zip -DestinationPath $unpacked -Force

  # GitHub の ZIP は「リポジトリ名-ブランチ名」の 1 フォルダに入っています。
  # 名前を決め打ちにせず、中にある唯一のフォルダを使います。
  $top = @(Get-ChildItem -Path $unpacked -Directory)
  if ($top.Count -ne 1) {
    Fail "ダウンロードした中身が想定と違います。" "Unexpected archive layout."
  }
  $source = Join-Path $top[0].FullName "lecture-recorder"
  if (-not (Test-Path (Join-Path $source "start.cmd"))) {
    Fail "ダウンロードした中にアプリが入っていません。" "The archive does not contain the app."
  }

  Write-Host "[3/4] ファイルを入れ替えています… / Replacing the app files…"

  # 時間割を書き換えている場合、その内容は消さずに取っておきます。
  $subjects = Join-Path $here "add-subjects.ps1"
  $incoming = Join-Path $source "add-subjects.ps1"
  if ((Test-Path $subjects) -and (Test-Path $incoming)) {
    if ((Get-FileHash $subjects).Hash -ne (Get-FileHash $incoming).Hash) {
      Copy-Item $subjects (Join-Path $here "add-subjects.前回.ps1") -Force
      Write-Host "      時間割を add-subjects.前回.ps1 として残しました。"
      Write-Host "      Kept your edited add-subjects.ps1 as add-subjects.前回.ps1."
    }
  }

  # 上書きするだけでは、上流で消したファイルが残って古いコードが混ざります。
  # ソースのフォルダは一度消してから入れ直します。node_modules と .env.local は
  # ここに挙げていないので、どちらも触りません。
  foreach ($dir in @("app", "components", "lib", "tests", "public", ".next")) {
    $path = Join-Path $here $dir
    if (Test-Path $path) { Remove-Item $path -Recurse -Force }
  }

  # update.cmd は今まさに cmd.exe が開いているので、上書きできません。
  Get-ChildItem -Path $source -Force |
    Where-Object { $_.Name -ne "update.cmd" } |
    ForEach-Object { Copy-Item $_.FullName -Destination $here -Recurse -Force }

  Write-Host "[4/4] 準備しています。数分かかります… / Preparing. This takes a few minutes…"
  Write-Host ""
  & npm install
  if ($LASTEXITCODE -ne 0) { Fail "準備に失敗しました。" "npm install failed." }
  & npm run build
  if ($LASTEXITCODE -ne 0) { Fail "準備に失敗しました。" "npm run build failed." }

  # start.cmd compares this stamp with VERSION to decide whether the build on
  # disk matches the source on disk.
  $version = Join-Path $here "VERSION"
  if (Test-Path $version) {
    Copy-Item $version (Join-Path $here ".next\BUILT_FROM") -Force -ErrorAction SilentlyContinue
  }

  Write-Host ""
  Write-Host "更新が完了しました。start.cmd（またはデスクトップのショートカット）で起動してください。"
  Write-Host "Update complete. Start the app with start.cmd or the desktop shortcut."
  Write-Host ""
  Write-Host "録音・書き起こし・ノート・API キーはそのまま残っています。"
  Write-Host "Your recordings, transcripts, notes and API key are untouched."
  Write-Host ""
} finally {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}

Read-Host "Enter キーで終了 / Press Enter to close"
