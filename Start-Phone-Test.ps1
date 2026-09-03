$ErrorActionPreference = "Stop"

$ruleName = "Bell Before Dusk Phone Test"
$port = 4173
$projectRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$pidFile = Join-Path $projectRoot ".phone-test.pid"
$urlFile = Join-Path $projectRoot "PHONE_TEST_URL.txt"
$python = (Get-Command python -ErrorAction Stop).Source

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdministrator) {
  Write-Host "Windows will ask permission to open a local-only test port. Choose Yes."
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  $elevated = Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $arguments -Wait -PassThru
  if ($elevated.ExitCode -ne 0) {
    throw "The elevated phone-test setup did not complete."
  }
  if (Test-Path -LiteralPath $urlFile) {
    Write-Host ""
    Write-Host "Open this address in iPhone Safari:" -ForegroundColor Cyan
    Get-Content -LiteralPath $urlFile
  }
  exit
}

$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
  New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $port `
    -Profile Private `
    -RemoteAddress LocalSubnet `
    -Program $python | Out-Null
}

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  $managedPid = if (Test-Path -LiteralPath $pidFile) { [int](Get-Content -LiteralPath $pidFile -Raw) } else { 0 }
  if ($listener.OwningProcess -ne $managedPid) {
    throw "Port $port is already being used by process $($listener.OwningProcess). Stop it before starting the phone test."
  }
} else {
  $server = Start-Process `
    -FilePath $python `
    -ArgumentList @("-m", "http.server", "$port", "--bind", "0.0.0.0") `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -PassThru
  Set-Content -LiteralPath $pidFile -Value $server.Id -Encoding ascii
}

$route = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction Stop | Sort-Object RouteMetric | Select-Object -First 1
$address = Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 -ErrorAction Stop |
  Where-Object { $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1
if (-not $address) {
  throw "No active Wi-Fi IPv4 address was found."
}

$url = "http://$($address.IPAddress):$port/"
Set-Content -LiteralPath $urlFile -Value $url -Encoding ascii
Write-Host "Phone test is running." -ForegroundColor Green
Write-Host "Open this address in iPhone Safari: $url" -ForegroundColor Cyan
Write-Host "Run Stop-Phone-Test.ps1 afterward to close the port and server."

