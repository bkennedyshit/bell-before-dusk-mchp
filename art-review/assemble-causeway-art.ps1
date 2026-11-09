Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $projectDirectory 'assets\environment\concepts\platformers'
$generatedDirectory = 'C:\Users\billk\.codex\generated_images\01a02491-b7d9-7030-82cc-0323fa63f728'
$outputs = @(
    @{ Source = 'exec-7f7f70a7-f4b7-4da3-b2a5-a3f03b2f21b2.png'; Name = 'flooded-causeway-v1-panel-a.png' },
    @{ Source = 'exec-a89f3559-157d-4ed1-875a-d70f5a9035c5.png'; Name = 'flooded-causeway-v1-panel-b.png' },
    @{ Source = 'exec-d96c463b-9c12-4262-9288-f3fd7d2f5bd9.png'; Name = 'demon-watch-arena-v1.png' }
)
foreach ($output in $outputs) {
    $source = [System.Drawing.Bitmap]::FromFile((Join-Path $generatedDirectory $output.Source))
    $panel = [System.Drawing.Bitmap]::new(2172,724,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($panel)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImageUnscaled($source,0,0)
    $graphics.Dispose()
    $panel.Save((Join-Path $destination $output.Name),[System.Drawing.Imaging.ImageFormat]::Png)
    $panel.Dispose()
    $source.Dispose()
}
$combined = [System.Drawing.Bitmap]::new(4344,724,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($combined)
$graphics.Clear([System.Drawing.Color]::Transparent)
foreach ($index in 0..1) {
    $panel = [System.Drawing.Bitmap]::FromFile((Join-Path $destination $outputs[$index].Name))
    $graphics.DrawImageUnscaled($panel,($index*2172),0)
    $panel.Dispose()
}
$graphics.Dispose()
$combined.Save((Join-Path $destination 'flooded-causeway-v1-combined.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$combined.Dispose()
