param(
    [Parameter(Mandatory = $true)]
    [string] $ApiBaseUrl,

    [Parameter(Mandatory = $true)]
    [string] $AdminEmail,

    [Parameter(Mandatory = $true)]
    [string] $AdminPassword,

    [switch] $SkipSwagger,

    [switch] $SkipCrudCleanup
)

$ErrorActionPreference = "Stop"
$results = New-Object System.Collections.Generic.List[object]
$createdProjectId = $null
$baseUrl = $ApiBaseUrl.TrimEnd("/")

function Add-Result {
    param([string] $Name, [string] $Status, [string] $Detail = "")
    $results.Add([pscustomobject]@{
        Check = $Name
        Status = $Status
        Detail = $Detail
    }) | Out-Null
}

function Invoke-RmsJson {
    param(
        [string] $Method,
        [string] $Path,
        [hashtable] $Headers = @{},
        [object] $Body = $null
    )

    $uri = "$baseUrl$Path"
    $parameters = @{
        Method = $Method
        Uri = $uri
        Headers = $Headers
        TimeoutSec = 30
    }

    if ($null -ne $Body) {
        $parameters.ContentType = "application/json"
        $parameters.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    return Invoke-RestMethod @parameters
}

try {
    $health = Invoke-RmsJson -Method Get -Path "/api/health"
    if (-not $health.success) { throw "Health response success=false." }
    Add-Result "API health" "PASS" "HTTP process is healthy."

    $dbHealth = Invoke-RmsJson -Method Get -Path "/api/health/database"
    if (-not $dbHealth.success) { throw "Database health response success=false." }
    Add-Result "Database health" "PASS" "Database connection succeeded."

    if (-not $SkipSwagger) {
        $swagger = Invoke-RmsJson -Method Get -Path "/swagger/v1/swagger.json"
        if (-not $swagger.openapi -and -not $swagger.swagger) { throw "Swagger JSON did not look valid." }
        Add-Result "Swagger JSON" "PASS" "Swagger endpoint returned JSON."
    } else {
        Add-Result "Swagger JSON" "SKIP" "Skipped by parameter."
    }

    $login = Invoke-RmsJson -Method Post -Path "/api/auth/login" -Body @{
        usernameOrEmail = $AdminEmail
        password = $AdminPassword
    }

    $token = $login.data.token
    if (-not $token) { $token = $login.data.accessToken }
    if (-not $token) { throw "Login did not return a token field." }
    Add-Result "Login" "PASS" "Token received without printing it."

    $authHeaders = @{ Authorization = "Bearer $token" }

    $me = Invoke-RmsJson -Method Get -Path "/api/auth/me" -Headers $authHeaders
    if (-not $me.success) { throw "Current user response success=false." }
    Add-Result "Current user" "PASS" "Authenticated user endpoint returned OK."

    $projects = Invoke-RmsJson -Method Get -Path "/api/research-projects?pageSize=1" -Headers $authHeaders
    if (-not $projects.success) { throw "Research projects response success=false." }
    Add-Result "Research projects list" "PASS" "GET /api/research-projects succeeded."

    $phases = Invoke-RmsJson -Method Get -Path "/api/project-phases?pageSize=1" -Headers $authHeaders
    if (-not $phases.success) { throw "Project phases response success=false." }
    Add-Result "Project phases list" "PASS" "GET /api/project-phases succeeded."

    $milestones = Invoke-RmsJson -Method Get -Path "/api/project-milestones?pageSize=1" -Headers $authHeaders
    if (-not $milestones.success) { throw "Project milestones response success=false." }
    Add-Result "Project milestones list" "PASS" "GET /api/project-milestones succeeded."

    $deadlines = Invoke-RmsJson -Method Get -Path "/api/project-deadlines?pageSize=1" -Headers $authHeaders
    if (-not $deadlines.success) { throw "Project deadlines response success=false." }
    Add-Result "Project deadlines list" "PASS" "GET /api/project-deadlines succeeded."

    $training = Invoke-RmsJson -Method Get -Path "/api/training-events?pageSize=1" -Headers $authHeaders
    if (-not $training.success) { throw "Training events response success=false." }
    Add-Result "Training events list" "PASS" "GET /api/training-events succeeded."

    $notifications = Invoke-RmsJson -Method Get -Path "/api/notifications?pageSize=1" -Headers $authHeaders
    if (-not $notifications.success) { throw "Notifications response success=false." }
    Add-Result "Notifications list" "PASS" "GET /api/notifications succeeded."

    $code = "DEPLOY-SMOKE-{0:yyyyMMddHHmmss}" -f (Get-Date)
    $createBody = @{
        projectCode = $code
        projectTitle = "Deployment smoke test project"
        description = "Temporary record created by Test-ProductionDeployment.ps1"
        departmentId = $null
        principalInvestigatorId = $null
        sponsorId = $null
        sponsorName = "Deployment Smoke Test"
        researchType = "quality_improvement"
        protocolNumber = $code
        protocolVersion = "1.0"
        ethicsStatus = "not_required"
        ethicsApprovalDate = $null
        ethicsExpiryDate = $null
        plannedStartDate = "2026-08-01"
        plannedEndDate = "2026-08-31"
        actualStartDate = $null
        actualEndDate = $null
        currentPhaseName = "Smoke test"
        progressPercent = 0
        projectStatus = "not_started"
        riskLevel = "low"
        notes = "Created for deployment smoke testing."
    }

    $created = Invoke-RmsJson -Method Post -Path "/api/research-projects" -Headers $authHeaders -Body $createBody
    $createdProjectId = $created.data.projectId
    if (-not $createdProjectId) { throw "Create project did not return projectId." }
    Add-Result "Research project create" "PASS" "Created temporary project $code."

    $updateBody = $createBody.Clone()
    $updateBody.projectTitle = "Deployment smoke test project updated"
    $updateBody.projectStatus = "in_progress"
    $updateBody.progressPercent = 10
    $updated = Invoke-RmsJson -Method Put -Path "/api/research-projects/$createdProjectId" -Headers $authHeaders -Body $updateBody
    if (-not $updated.success) { throw "Update project response success=false." }
    Add-Result "Research project update" "PASS" "Updated temporary project."

    if (-not $SkipCrudCleanup) {
        Invoke-RmsJson -Method Delete -Path "/api/research-projects/$createdProjectId" -Headers $authHeaders | Out-Null
        Add-Result "Research project cleanup" "PASS" "Deleted temporary project."
        $createdProjectId = $null
    } else {
        Add-Result "Research project cleanup" "SKIP" "Temporary project was left in place."
    }

    $results | Format-Table -AutoSize
    Write-Host "PASS: RMS deployment smoke test completed."
    exit 0
} catch {
    Add-Result "Failure" "FAIL" $_.Exception.Message

    if ($createdProjectId -and -not $SkipCrudCleanup) {
        try {
            Invoke-RmsJson -Method Delete -Path "/api/research-projects/$createdProjectId" -Headers $authHeaders | Out-Null
            Add-Result "Best-effort cleanup" "PASS" "Deleted temporary project after failure."
        } catch {
            Add-Result "Best-effort cleanup" "FAIL" "Could not delete temporary project."
        }
    }

    $results | Format-Table -AutoSize
    Write-Error "FAIL: RMS deployment smoke test failed. Password and token were not printed."
    exit 1
}
