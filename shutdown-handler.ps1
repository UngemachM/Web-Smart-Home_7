while ($true) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
        Start-Sleep -Seconds 1
    }
    catch {
        Write-Host "Server nicht mehr erreichbar, fahre Container herunter..."
        docker compose down
        break
    }
}