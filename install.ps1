$REPO = "gagantripathi22/portkill"
$INSTALL_DIR = "$env:LOCALAPPDATA\portkill"
$TEMP_DIR = [System.IO.Path]::GetTempPath()

# Detect architecture
if ($env:PROCESSOR_ARCHITECTURE -eq "AMD64" -or [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITEW6432") -eq "AMD64") {
    $arch = "amd64"
} elseif ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
    $arch = "arm64"
} else {
    Write-Host "Unsupported architecture" -ForegroundColor Red
    exit 1
}

$os = "windows"
$version = $args[0]

# Get latest version if not provided
if ([string]::IsNullOrEmpty($version)) {
    $response = Invoke-RestMethod "https://api.github.com/repos/$REPO/releases/latest" -UseBasicParsing
    $version = $response.tag_name
}

$binary_name = "portkill-${os}-${arch}.exe"
$url = "https://github.com/$REPO/releases/download/$version/$binary_name"
$checksum_url = "$url.sha256"

Write-Host "Downloading portkill ${version} for ${os}/${arch}..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile "$TEMP_DIR\$binary_name"

Write-Host "Verifying checksum..."
$expected = (Invoke-WebRequest -Uri $checksum_url -UseBasicParsing).Content.Split(" ")[0]
$actual = (Get-FileHash "$TEMP_DIR\$binary_name" -Algorithm SHA256).Hash.ToLower()
if ($expected -ne $actual) {
    Write-Host "Checksum mismatch!" -ForegroundColor Red
    Remove-Item "$TEMP_DIR\$binary_name" -Force
    exit 1
}

Write-Host "Installing..."
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
Move-Item -Force "$TEMP_DIR\$binary_name" "$INSTALL_DIR\portkill.exe"

Write-Host "Successfully installed portkill $version to $INSTALL_DIR\portkill.exe" -ForegroundColor Green
Write-Host ""
Write-Host "Add $INSTALL_DIR to your PATH if not already added."
Write-Host "Then run: portkill.exe --help"
