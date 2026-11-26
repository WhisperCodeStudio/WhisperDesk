$ErrorActionPreference = "Stop"

$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = "http://localhost:3000"

function Test-WhisperDesk {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

if (-not (Test-WhisperDesk)) {
  $command = "Set-Location -LiteralPath '$ProjectPath'; npm run dev"
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $command
  ) -WorkingDirectory $ProjectPath

  $ready = $false
  for ($attempt = 1; $attempt -le 40; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-WhisperDesk) {
      $ready = $true
      break
    }
  }
}

Start-Process $Url
