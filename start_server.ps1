# Local PowerShell Web Server for St. Venus High School Web App
$http = New-Object System.Net.HttpListener
$http.Prefixes.Add("http://localhost:8000/")
$http.Prefixes.Add("http://127.0.0.1:8000/")

try {
    $http.Start()
    Write-Host "=========================================================="
    Write-Host "Local Web Server successfully running!"
    Write-Host "URL: http://localhost:8000/"
    Write-Host "URL: http://127.0.0.1:8000/"
    Write-Host "=========================================================="
} catch {
    Write-Host "HttpListener error: $_"
    exit 1
}

while ($http.IsListening) {
    $context = $http.GetContext()
    $request = $context.Request
    $response = $context.Response

    $filePath = "C:\Users\Manzoor\.gemini\antigravity\scratch\school-management-system\index.html"
    
    if (Test-Path $filePath) {
        $buffer = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $buffer.Length
        $response.ContentType = "text/html; charset=utf-8"
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}
