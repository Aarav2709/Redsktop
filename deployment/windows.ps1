<#
Deploy helper that mirrors the Linux flow but uses PowerShell semantics.
Usage: .\windows.ps1 [-Serve]
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path "$ScriptDir\.."
$ServeMode = $false
$ServerPort = if ($env:PORT) { [int]$env:PORT } else { 4000 }

if ($PSBoundParameters.ContainsKey('Serve')) {
    $ServeMode = $true
}

function Run-Step {
    param(
        [string]$Label,
        [string]$RelativeDir,
        [string]$Command
    )
    Write-Host "[setup] $Label..."
    Push-Location "$RootDir\$RelativeDir"
    Invoke-Expression $Command
    Pop-Location
}

function Kill-Port {
    param([int]$Port)
    if (-not (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue)) {
        return
    }
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections.OwningProcess | Select-Object -Unique
        if ($pids) {
            Write-Host "[setup] freeing port $Port (pids: $($pids -join ', '))"
            foreach ($pid in $pids) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Run-Step 'server deps' 'server' 'npm install'
Run-Step 'client deps' 'client' 'npm install'
Run-Step 'electron deps' 'electron' 'npm install'

Run-Step 'server tests' 'server' 'npm test'
Run-Step 'server build' 'server' 'npm run build'
Run-Step 'client build' 'client' 'npm run build'
Run-Step 'electron build' 'electron' 'npm run build --if-present'

if ($ServeMode) {
    Kill-Port -Port $ServerPort
    Kill-Port -Port 5173
    Kill-Port -Port 5174
    Kill-Port -Port 5175

    Write-Host '[setup] starting server and client preview...'
    $global:ServerProcess = Start-Process -NoNewWindow -FilePath 'npm' -ArgumentList 'run', 'start' -WorkingDirectory "$RootDir\server" -PassThru
    $global:ClientProcess = Start-Process -NoNewWindow -FilePath 'npm' -ArgumentList 'run', 'preview', '--', '--host', '0.0.0.0', '--port', '5173' -WorkingDirectory "$RootDir\client" -PassThru
    Write-Host "[setup] server pid: $($global:ServerProcess.Id), client pid: $($global:ClientProcess.Id)"

    try {
        Write-Host '[setup] running. Press Ctrl+C to stop.'
        Wait-Process -Id $global:ServerProcess.Id, $global:ClientProcess.Id
    } finally {
        Write-Host '[setup] stopping...'
        if ($global:ServerProcess) { Stop-Process -Id $global:ServerProcess.Id -Force -ErrorAction SilentlyContinue }
        if ($global:ClientProcess) { Stop-Process -Id $global:ClientProcess.Id -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host '[setup] done.'
