Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$conceptDirectory = Join-Path $projectDirectory 'assets\environment\concepts'
$platformDirectory = Join-Path $conceptDirectory 'platformers'
$generatedDirectory = 'C:\Users\billk\.codex\generated_images\01a02491-b7d9-7030-82cc-0323fa63f728'

# These are selected generation outputs. Preserve raw source files; normalize
# only the transport canvas by padding/cropping, with no terrain stretching.
$sets = @(
    @{ Name = 'harvest-levee-v1'; A = 'exec-3566172d-a9a2-42af-87bb-0b336db7cc8c.png'; B = 'exec-004ab280-6b04-4c0f-8084-954435f78899.png' },
    @{ Name = 'bandit-storehouse-v1'; A = 'exec-cf9b94ed-f3bc-4dfe-8377-b12bdec397cd.png'; B = 'exec-2dd9882f-9c93-48f8-98a5-6913209e121c.png' }
)
foreach ($set in $sets) {
    $combined = [System.Drawing.Bitmap]::new(4344, 724, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $combinedGraphics = [System.Drawing.Graphics]::FromImage($combined)
    $combinedGraphics.Clear([System.Drawing.Color]::Transparent)
    foreach ($index in 0..1) {
        $key = if ($index -eq 0) { 'A' } else { 'B' }
        $suffix = if ($index -eq 0) { 'a' } else { 'b' }
        $source = [System.Drawing.Bitmap]::FromFile((Join-Path $generatedDirectory $set[$key]))
        $panel = [System.Drawing.Bitmap]::new(2172, 724, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($panel)
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImageUnscaled($source, 0, 0)
        $graphics.Dispose()
        $panel.Save((Join-Path $platformDirectory ($set.Name + '-panel-' + $suffix + '.png')), [System.Drawing.Imaging.ImageFormat]::Png)
        $combinedGraphics.DrawImageUnscaled($panel, ($index * 2172), 0)
        $panel.Dispose()
        $source.Dispose()
    }
    $combinedGraphics.Dispose()
    $combined.Save((Join-Path $platformDirectory ($set.Name + '-combined.png')), [System.Drawing.Imaging.ImageFormat]::Png)
    $combined.Dispose()
}
Copy-Item -LiteralPath (Join-Path $generatedDirectory 'exec-89b79d72-73f4-433c-8881-3d5e23777bee.png') -Destination (Join-Path $conceptDirectory 'southern-high-road-v1.png')

# Preview the real alpha composite over a neutral background.
$preview = [System.Drawing.Bitmap]::new(1448, 484)
$previewGraphics = [System.Drawing.Graphics]::FromImage($preview)
$previewGraphics.Clear([System.Drawing.Color]::FromArgb(30, 40, 48))
foreach ($index in 0..1) {
    $source = [System.Drawing.Bitmap]::FromFile((Join-Path $platformDirectory ($sets[$index].Name + '-combined.png')))
    $previewGraphics.DrawImage($source, 0, ($index * 242), 1448, 241)
    $source.Dispose()
}
$previewGraphics.Dispose()
$preview.Save((Join-Path $conceptDirectory 'expansion-platformers-preview-v1.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$preview.Dispose()
