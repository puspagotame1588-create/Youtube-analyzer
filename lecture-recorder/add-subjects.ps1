# 科目をまとめて登録するスクリプト
#
# 使い方:
#   1. アプリを起動しておく（start.cmd、または npm start）
#   2. 下の $subjects を自分の時間割に書き換える
#   3. このファイルを右クリック →「PowerShell で実行」
#      うまくいかない場合は、フォルダのアドレスバーに powershell と入力して開き、
#      次を実行してください:  powershell -ExecutionPolicy Bypass -File .\add-subjects.ps1
#
# keywords には、その授業で出てくる専門用語を入れてください。
# 音声認識のヒントとして使われ、書き起こしの表記もここに合わせて統一されます。
# シラバスや教科書の目次から写すのが手軽で効果的です。

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3939"

$subjects = @'
[
  {
    "name": "科目名（曜日・時限）",
    "teacher": "担当教員",
    "language": "ja",
    "keywords": ["専門用語1", "専門用語2", "専門用語3"]
  },
  {
    "name": "Another Course (Mon 2)",
    "teacher": "Teacher Name",
    "language": "en",
    "keywords": ["term one", "term two"]
  }
]
'@

try {
  Invoke-RestMethod -Uri "$baseUrl/api/health" -TimeoutSec 5 | Out-Null
} catch {
  Write-Host ""
  Write-Host "[!] アプリに接続できません / Cannot reach the app at $baseUrl"
  Write-Host "    先に start.cmd を実行してから、もう一度お試しください。"
  Write-Host "    Start the app first, then run this again."
  Write-Host ""
  Read-Host "Enter キーで終了"
  exit 1
}

$added = 0
foreach ($subject in ($subjects | ConvertFrom-Json)) {
  # The body is sent as UTF-8 bytes so Japanese survives whatever code page the
  # console happens to be using.
  $json = $subject | ConvertTo-Json -Depth 5 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  try {
    $created = Invoke-RestMethod -Uri "$baseUrl/api/courses" -Method Post `
      -ContentType "application/json" -Body $bytes
    Write-Host ("  追加しました / added: " + $created.name)
    $added++
  } catch {
    Write-Host ("  [!] 失敗 / failed: " + $subject.name + " -- " + $_.Exception.Message)
  }
}

Write-Host ""
Write-Host "$added 件の科目を登録しました。ブラウザのライブラリを再読み込みしてください。"
Write-Host "Added $added subjects. Reload the Library page in your browser."
Write-Host ""
Read-Host "Enter キーで終了"
