<#
==============================================================================
LM Studio MCP Connector - Windows Dedicated Installer & Configurator
Compatible with Windows 10, Windows 11, Windows Server (PowerShell 5.1 & Core 7+)
==============================================================================
#>

[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

Write-Host "=== LM Studio MCP Connector: Windows Setup ===" -ForegroundColor Cyan
Write-Host "Operating System: Windows ($([System.Environment]::OSVersion.VersionString))"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot
Write-Host "Target Directory: $RepoRoot`n"

# 1. Verify Node.js presence
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
    Write-Host "Error: Node.js is not found in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ using winget or from https://nodejs.org/ :"
    Write-Host "  winget install OpenJS.NodeJS.LTS"
    exit 1
}

# 2. Check Node.js version
$NodeVer = (node -v).Trim()
$MajorVer = [int]($NodeVer.TrimStart('v').Split('.')[0])
if ($MajorVer -lt 18) {
    Write-Host "Error: Node.js version 18+ is required (Detected: $NodeVer)." -ForegroundColor Red
    Write-Host "Please update Node.js via winget or nvm-windows."
    exit 1
}
Write-Host "[OK] Node.js detected: $NodeVer" -ForegroundColor Green

# 3. Verify npm
$NpmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $NpmCmd) {
    $NpmCmd = Get-Command npm -ErrorAction SilentlyContinue
}
if (-not $NpmCmd) {
    Write-Host "Error: npm is not found in PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] npm detected: $((& $NpmCmd -v).Trim())" -ForegroundColor Green

# 4. Install dependencies
Write-Host "`n[1/3] Installing dependencies..." -ForegroundColor Yellow
& $NpmCmd install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm install failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 5. Build TypeScript
Write-Host "`n[2/3] Compiling TypeScript project..." -ForegroundColor Yellow
& $NpmCmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: TypeScript compilation failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 6. Execute setup assistant
Write-Host "`n[3/3] Running configuration assistant..." -ForegroundColor Yellow
$SetupScript = Join-Path $RepoRoot "scripts\setup.js"
& node $SetupScript @RemainingArgs
exit $LASTEXITCODE

