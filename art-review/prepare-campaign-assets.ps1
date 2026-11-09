$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$sourceDirectory = Join-Path $projectDirectory 'assets\environment\concepts'
$destination = Join-Path $projectDirectory 'assets\environment\campaign'
New-Item -ItemType Directory -Force -Path (Join-Path $destination 'platformers') | Out-Null
foreach ($name in @('cedar-hamlet-concept-v2.png','willow-ferry-concept-v2.png','southern-high-road-v3-combined.png')) {
    Copy-Item -LiteralPath (Join-Path $sourceDirectory $name) -Destination (Join-Path $destination $name)
}
foreach ($name in @('cedar-canopy-lanes-v1','flooded-causeway-v1','harvest-levee-v1','bandit-storehouse-v1')) {
    foreach ($panel in @('a','b')) {
        $relative = 'platformers\' + $name + '-panel-' + $panel + '.png'
        Copy-Item -LiteralPath (Join-Path $sourceDirectory $relative) -Destination (Join-Path $destination $relative)
    }
}
