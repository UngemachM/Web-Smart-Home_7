Write-Host "Starte Container..."
docker compose up --build -d

Write-Host "Starte Shutdown Handler..."
Start-Process powershell -ArgumentList "-File shutdown-handler.ps1"

Write-Host "Warte auf Container-Start (15 Sekunden)..."
Start-Sleep -Seconds 15

Write-Host "Öffne Dashboard..."
Start-Process "http://localhost:8080"

# Write-Host "Druecke 'Q' zum Beenden der Container"
# Write-Host "Druecke 'X' zum Beenden des Scripts"

# while ($true) {
#     if ([Console]::KeyAvailable) {
#         $key = [Console]::ReadKey($true)
        
#         switch ($key.Key) {
#             'Q' {
#                 Write-Host "`nBeende Container..."
#                 docker compose down
#                 break
#             }

#             'X' {
#                 Write-Host "`nBeende Script..."
#                 exit
#             }
#         }
#     }
#     Start-Sleep -Milliseconds 100
# }