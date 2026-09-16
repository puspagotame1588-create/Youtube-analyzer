# デスクトップに「講義レコーダー」のショートカットを作ります。
# 直接ではなく setup-shortcut.cmd をダブルクリックして実行してください。

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
$target = Join-Path $here "start.cmd"
$icon = Join-Path $here "icon.ico"
$name = "講義レコーダー.lnk"

if (-not (Test-Path $target)) {
  Write-Host "[!] start.cmd が見つかりません / start.cmd not found next to this script."
  Read-Host "Enter キーで終了"
  exit 1
}

function New-AppShortcut($path, $minimised) {
  $shell = New-Object -ComObject WScript.Shell
  $link = $shell.CreateShortcut($path)
  $link.TargetPath = $target
  $link.WorkingDirectory = $here
  $link.Description = "講義レコーダーを起動します"
  if (Test-Path $icon) { $link.IconLocation = $icon }
  # 7 = minimised, so an auto-started window stays out of the way.
  $link.WindowStyle = if ($minimised) { 7 } else { 1 }
  $link.Save()
}

$desktop = Join-Path ([Environment]::GetFolderPath("Desktop")) $name
New-AppShortcut $desktop $false
Write-Host ""
Write-Host "デスクトップにショートカットを作りました / Desktop shortcut created:"
Write-Host "  $desktop"
Write-Host ""
Write-Host "タスクバーに置きたいときは、このアイコンをタスクバーへドラッグしてください。"
Write-Host "To keep it on the taskbar, drag that icon onto the taskbar."
Write-Host ""

$startupPath = Join-Path ([Environment]::GetFolderPath("Startup")) $name
if (Test-Path $startupPath) {
  Write-Host "自動起動はすでに設定されています / Already set to start with Windows."
  $answer = Read-Host "解除しますか？ Remove it? (y/N)"
  if ($answer -match '^[yY]') {
    Remove-Item $startupPath -Force
    Write-Host "自動起動を解除しました / Removed."
  }
} else {
  Write-Host "Windows にサインインしたときに自動で起動しておくと、授業の前に"
  Write-Host "ブラウザで localhost:3939 を開くだけで使えます（画面は最小化されます）。"
  $answer = Read-Host "自動起動にしますか？ Start with Windows? (y/N)"
  if ($answer -match '^[yY]') {
    New-AppShortcut $startupPath $true
    Write-Host "自動起動に設定しました / Done."
  } else {
    Write-Host "自動起動は設定しませんでした / Skipped."
  }
}

Write-Host ""
Read-Host "Enter キーで終了"
