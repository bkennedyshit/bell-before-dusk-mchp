param([switch]$Install, [string]$Device, [switch]$ReleaseBundle)
$ErrorActionPreference = 'Stop'
if ($Install -and $ReleaseBundle) { throw 'Release bundles are not directly installable. Use the debug APK for emulator testing.' }
$bellRoot = Split-Path $PSScriptRoot -Parent
$bellMobile = Join-Path $bellRoot 'mobile'
$bellSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$bellJava = Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'
if (!(Test-Path (Join-Path $bellJava 'bin\java.exe'))) { $bellJava = $env:JAVA_HOME }
if (!$bellJava -or !(Test-Path (Join-Path $bellJava 'bin\java.exe'))) { throw 'Install Android Studio or configure JAVA_HOME.' }
if (!(Test-Path $bellSdk)) { throw 'Install the Android SDK or configure ANDROID_HOME.' }
$env:JAVA_HOME = $bellJava
$env:ANDROID_HOME = $bellSdk
Push-Location $bellMobile
try {
    if (!(Test-Path 'node_modules/@capacitor/cli')) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    if ($ReleaseBundle) {
        & node.exe ../tools/stage-android-web.cjs --release
        if ($LASTEXITCODE -ne 0) { throw 'Release staging failed.' }
        & npx.cmd cap sync android
    } else { & npm.cmd run sync }
    if ($LASTEXITCODE -ne 0) { throw 'Staging Android assets failed.' }
    $bellTask = if ($ReleaseBundle) { 'bundleRelease' } else { 'assembleDebug' }
    & .\android\gradlew.bat -p android $bellTask --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
    $bellOutput = Join-Path $bellRoot 'dist\android'
    New-Item -ItemType Directory -Path $bellOutput -Force | Out-Null
    if ($ReleaseBundle) {
        $bellBundle = Join-Path $bellOutput 'bell-before-dusk-0.3.1-release-unsigned.aab'
        Copy-Item -LiteralPath 'android/app/build/outputs/bundle/release/app-release.aab' -Destination $bellBundle -Force
        Write-Output "Unsigned AAB (requires final identity/signing/Play setup): $bellBundle"
        return
    }
    $bellApk = Join-Path $bellOutput 'bell-before-dusk-0.3.1-campaign-debug.apk'
    Copy-Item -LiteralPath 'android/app/build/outputs/apk/debug/app-debug.apk' -Destination $bellApk -Force
    Write-Output "APK: $bellApk"
    if ($Install) {
        $bellAdb = Join-Path $bellSdk 'platform-tools\adb.exe'
        $bellArgs = if ($Device) { @('-s', $Device) } else { @() }
        & $bellAdb @bellArgs install -r $bellApk
        if ($LASTEXITCODE -ne 0) { throw 'ADB installation failed. Check adb devices and phone authorization.' }
        & $bellAdb @bellArgs shell am start -n 'com.bellbeforedusk.playtest/.MainActivity'
        if ($LASTEXITCODE -ne 0) { throw 'ADB launch failed.' }
    }
} finally { Pop-Location }
