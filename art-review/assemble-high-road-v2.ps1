Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $projectDirectory 'assets\environment\concepts'
$generatedDirectory = 'C:\Users\billk\.codex\generated_images\01a02491-b7d9-7030-82cc-0323fa63f728'
$topPath = Join-Path $destination 'southern-high-road-v2-top.png'
$bottomPath = Join-Path $destination 'southern-high-road-v2-bottom.png'
Copy-Item -LiteralPath (Join-Path $generatedDirectory 'exec-644f729f-202b-412e-8ad2-87cc4b5852c4.png') -Destination $topPath
Copy-Item -LiteralPath (Join-Path $generatedDirectory 'exec-68643526-f53b-4bf6-a00b-db301e981542.png') -Destination $bottomPath
$top = [System.Drawing.Bitmap]::FromFile($topPath)
$bottom = [System.Drawing.Bitmap]::FromFile($bottomPath)
if ($top.Width -ne $bottom.Width) { throw 'Panel widths must match.' }
$overlap = 96
$offset = $top.Height - $overlap
$combined = [System.Drawing.Bitmap]::new($top.Width, ($top.Height + $bottom.Height - $overlap))
$graphics = [System.Drawing.Graphics]::FromImage($combined)
$graphics.DrawImageUnscaled($top, 0, 0)
$graphics.DrawImage($bottom,
    [System.Drawing.Rectangle]::new(0, $top.Height, $bottom.Width, ($bottom.Height - $overlap)),
    [System.Drawing.Rectangle]::new(0, $overlap, $bottom.Width, ($bottom.Height - $overlap)),
    [System.Drawing.GraphicsUnit]::Pixel)
for ($row = 0; $row -lt $overlap; $row++) {
    $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
    $matrix.Matrix33 = [single]($row / ($overlap - 1))
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    $attributes.SetColorMatrix($matrix)
    $graphics.DrawImage($bottom,
        [System.Drawing.Rectangle]::new(0, ($offset + $row), $bottom.Width, 1),
        0, $row, $bottom.Width, 1, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
    $attributes.Dispose()
}
$graphics.Dispose()
$combined.Save((Join-Path $destination 'southern-high-road-v2-combined.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$seam = $combined.Clone([System.Drawing.Rectangle]::new(0, ($offset - 100), $combined.Width, 296), $combined.PixelFormat)
$seam.Save((Join-Path $destination 'southern-high-road-v2-seam-review.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$preview = [System.Drawing.Bitmap]::new(512, 1488)
$previewGraphics = [System.Drawing.Graphics]::FromImage($preview)
$previewGraphics.DrawImage($combined, 0, 0, 512, 1488)
$previewGraphics.Dispose()
$preview.Save((Join-Path $destination 'southern-high-road-v2-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$preview.Dispose()
$seam.Dispose()
$combined.Dispose()
$top.Dispose()
$bottom.Dispose()
