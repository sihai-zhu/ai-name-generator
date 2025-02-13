# Download Node.js installer
$nodeVersion = "18.20.0"
$downloadUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
$installerPath = "$env:TEMP\node_installer.msi"

Write-Host "Downloading Node.js v$nodeVersion..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath

# Install Node.js
Write-Host "Installing Node.js..."
Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn ADDLOCAL=ALL" -Wait

# Refresh environment variables
Write-Host "Updating environment variables..."
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "Verifying installation..."
& "C:\Program Files\nodejs\node.exe" -v
& "C:\Program Files\nodejs\npm.cmd" -v

Write-Host "Installation completed!"
