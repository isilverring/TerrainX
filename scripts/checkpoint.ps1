param([Parameter(Mandatory=$true)][string]$Message)
$ErrorActionPreference = 'Stop'
$terrainRoot = Split-Path -Parent $PSScriptRoot
if ((git -C $terrainRoot rev-parse --show-toplevel).Replace('/','\') -ne $terrainRoot) { throw 'Run from the TerrainX checkout.' }
git -C $terrainRoot add --all
if ($LASTEXITCODE -ne 0) { throw 'Staging failed.' }
git -C $terrainRoot diff --cached --quiet
if ($LASTEXITCODE -eq 1) { git -C $terrainRoot commit -m $Message; if ($LASTEXITCODE -ne 0) { throw 'Commit failed.' } }
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'Never'
git -C $terrainRoot push origin main
if ($LASTEXITCODE -ne 0) { throw 'Push failed. Local commit retained; document the blocker.' }
$terrainHead = git -C $terrainRoot rev-parse HEAD
$terrainRemote = (git -C $terrainRoot ls-remote origin refs/heads/main).Split()[0]
if ($terrainHead -ne $terrainRemote) { throw 'Remote verification failed.' }
Write-Output "Verified durable GitHub checkpoint: $terrainHead"
