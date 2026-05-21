# trigger-price-check.ps1
# Automated price check script

$url = "http://localhost:3000/api/admin/trigger-price-check"

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Price check completed" -ForegroundColor Green
    Write-Host "  Affected users: $($result.affectedUsers)" -ForegroundColor Cyan
    
    # Log to file
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Success - Affected: $($result.affectedUsers)"
    Add-Content -Path "price-check.log" -Value $logEntry
    
} catch {
    Write-Host "✗ Price check failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Log error
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Error - $($_.Exception.Message)"
    Add-Content -Path "price-check.log" -Value $logEntry
}
