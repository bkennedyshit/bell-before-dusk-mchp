$ErrorActionPreference = "Stop"

$ruleName = "Bell Before Dusk Phone Test"
$projectRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$pidFile = Join-Path $projectRoot ".phone-test.pid"
$urlFile = Join-Path $projectRoot "PHONE_TEST_URL.txt"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdministrator) {
  Write-Host "Windows will ask permission to remove the temporary phone-test rule. Choose Yes."
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  $elevated = Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $arguments -Wait -PassThru
  if ($elevated.ExitCode -ne 0) {
    throw "The elevated phone-test cleanup did not complete."
  }
  Write-Host "Phone test stopped and temporary firewall access removed." -ForegroundColor Green
  exit
}

if (Test-Path -LiteralPath $pidFile) {
  $serverPid = [int](Get-Content -LiteralPath $pidFile -Raw)
  $server = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
  if ($server) { Stop-Process -Id $serverPid -Force }
  Remove-Item -LiteralPath $pidFile -Force
}

Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
if (Test-Path -LiteralPath $urlFile) { Remove-Item -LiteralPath $urlFile -Force }

