Add-Type -AssemblyName System.Drawing

$outputDirectory = Join-Path $PSScriptRoot '..\assets\environment\concepts\route-blueprints'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$width = 4344
$height = 724
$panelWidth = 2172
$pixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
$background = [System.Drawing.Color]::FromArgb(255, 12, 16, 22)
$terrain = [System.Drawing.Color]::FromArgb(255, 67, 72, 76)
$terrainEdge = [System.Drawing.Color]::FromArgb(255, 237, 184, 63)
$waterColor = [System.Drawing.Color]::FromArgb(255, 30, 118, 176)
$hazard = [System.Drawing.Color]::FromArgb(255, 177, 49, 49)
$transition = [System.Drawing.Color]::FromArgb(255, 82, 191, 111)

function Add-Platform {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Bottom = 620
    )

    $Graphics.FillRectangle((New-Object System.Drawing.SolidBrush $terrain), $X, $Y, $Width, ($Bottom - $Y))
    $Graphics.FillRectangle((New-Object System.Drawing.SolidBrush $terrainEdge), $X, $Y, $Width, 10)
}

function Add-StepsUp {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$LowY,
        [int]$HighY,
        [int]$StepWidth = 90
    )

    $stepCount = 5
    $rise = [math]::Floor(($LowY - $HighY) / $stepCount)
    for ($index = 0; $index -lt $stepCount; $index++) {
        $stepY = $LowY - (($index + 1) * $rise)
        Add-Platform -Graphics $Graphics -X ($X + ($index * $StepWidth)) -Y $stepY -Width $StepWidth
    }
}

function Add-OneWayPlatform {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Thickness = 54
    )

    $Graphics.FillRectangle((New-Object System.Drawing.SolidBrush $terrain), $X, $Y, $Width, $Thickness)
    $Graphics.FillRectangle((New-Object System.Drawing.SolidBrush $terrainEdge), $X, $Y, $Width, 10)
}

function Save-Blueprint {
    param(
        [string]$Name,
        [scriptblock]$Draw,
        [bool]$IncludeWater = $true
    )

    $bitmap = New-Object System.Drawing.Bitmap $width, $height, $pixelFormat
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $graphics.Clear($background)
    if ($IncludeWater) {
        $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $waterColor), 0, 620, $width, 104)
    }

    & $Draw $graphics

    $fullPath = Join-Path $outputDirectory "$Name-full.png"
    $bitmap.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)

    foreach ($panel in 0..1) {
        $panelBitmap = New-Object System.Drawing.Bitmap $panelWidth, $height, $pixelFormat
        $panelGraphics = [System.Drawing.Graphics]::FromImage($panelBitmap)
        $panelGraphics.DrawImage(
            $bitmap,
            (New-Object System.Drawing.Rectangle 0, 0, $panelWidth, $height),
            (New-Object System.Drawing.Rectangle ($panel * $panelWidth), 0, $panelWidth, $height),
            [System.Drawing.GraphicsUnit]::Pixel
        )
        $suffix = if ($panel -eq 0) { 'panel-a' } else { 'panel-b' }
        $panelBitmap.Save((Join-Path $outputDirectory "$Name-$suffix.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $panelGraphics.Dispose()
        $panelBitmap.Dispose()
    }

    $graphics.Dispose()
    $bitmap.Dispose()
}

Save-Blueprint -Name 'river-bridge-stepper' -Draw {
    param($graphics)

    # High road and bridge terminate in a forced safe drop.
    Add-Platform -Graphics $graphics -X 0 -Y 300 -Width 1550
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $hazard), 1550, 300, 90, 20)

    # The lower dock road is the only forward route after the bridge break.
    Add-Platform -Graphics $graphics -X 1450 -Y 500 -Width 1760

    # A literal staircase, not a wedge, returns the player to the upper road.
    Add-StepsUp -Graphics $graphics -X 3090 -LowY 500 -HighY 300
    Add-Platform -Graphics $graphics -X 3540 -Y 300 -Width 804

    # Mark the forced drop and final exit without creating additional lanes.
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $transition), 1480, 330, 35, 150)
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $transition), 4270, 250, 35, 50)
}

Save-Blueprint -Name 'bamboo-gate-stepper' -Draw {
    param($graphics)

    # Begin low, climb once, and stay high for a long combat corridor.
    Add-Platform -Graphics $graphics -X 0 -Y 500 -Width 900
    Add-StepsUp -Graphics $graphics -X 900 -LowY 500 -HighY 300
    Add-Platform -Graphics $graphics -X 1350 -Y 300 -Width 1120

    # A blocked upper wall forces a safe drop to the second lower corridor.
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $hazard), 2390, 220, 80, 80)
    Add-Platform -Graphics $graphics -X 2330 -Y 500 -Width 1080
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $transition), 2380, 330, 35, 150)

    # Hard steps return to the upper exit; there is no ramp or third lane.
    Add-StepsUp -Graphics $graphics -X 3310 -LowY 500 -HighY 300
    Add-Platform -Graphics $graphics -X 3760 -Y 300 -Width 584
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $transition), 4270, 250, 35, 50)
}

Save-Blueprint -Name 'cedar-canopy-lanes' -IncludeWater $false -Draw {
    param($graphics)

    # A continuous floor plus two repeated one-way landing bands. The bands
    # are deliberately staggered so changing height remains a player choice.
    Add-Platform -Graphics $graphics -X 0 -Y 570 -Width $width -Bottom 724

    Add-OneWayPlatform -Graphics $graphics -X 0 -Y 410 -Width 900
    Add-OneWayPlatform -Graphics $graphics -X 1040 -Y 410 -Width 980
    Add-OneWayPlatform -Graphics $graphics -X 2160 -Y 410 -Width 1010
    Add-OneWayPlatform -Graphics $graphics -X 3320 -Y 410 -Width 1024

    Add-OneWayPlatform -Graphics $graphics -X 210 -Y 250 -Width 920
    Add-OneWayPlatform -Graphics $graphics -X 1320 -Y 250 -Width 1010
    Add-OneWayPlatform -Graphics $graphics -X 2530 -Y 250 -Width 900
    Add-OneWayPlatform -Graphics $graphics -X 3630 -Y 250 -Width 714

    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $transition), 4270, 520, 35, 50)
}

Get-ChildItem -LiteralPath $outputDirectory -Filter '*.png' | Sort-Object Name | ForEach-Object {
    $_.FullName
}
