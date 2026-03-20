param(
    [string]$Repo = "",
    [string]$DraftFile = ".agents/github-issue-drafts.md",
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-IssueTitle {
    param([string]$Title)
    if (-not $Title) { return $Title }
    # Avoid CLI/API edge cases with embedded double-quotes in titles.
    return $Title.Replace('"', "'")
}

function Get-Repo {
    param([string]$InputRepo)
    if ($InputRepo) { return $InputRepo }
    $detected = & gh repo view --json nameWithOwner --jq .nameWithOwner 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $detected) {
        throw "Could not determine repo. Pass -Repo owner/name."
    }
    return $detected.Trim()
}

function Parse-Issues {
    param([string]$Content)

    $headingRegex = [regex]'(?m)^##\s+(\d+)\)\s+(.+)$'
    $matches = $headingRegex.Matches($Content)
    if ($matches.Count -eq 0) {
        throw "No issue sections found in draft markdown."
    }

    $issues = @()
    for ($i = 0; $i -lt $matches.Count; $i++) {
        $m = $matches[$i]
        $start = $m.Index + $m.Length
        $end = if ($i -lt $matches.Count - 1) { $matches[$i + 1].Index } else { $Content.Length }
        $chunk = $Content.Substring($start, $end - $start).Trim()

        $labelMatch = [regex]::Match($chunk, '(?m)^\*\*Labels:\*\*\s+(.+)$')
        if (-not $labelMatch.Success) {
            throw "Missing labels line for draft issue #$($m.Groups[1].Value)."
        }

        $labelsRaw = $labelMatch.Groups[1].Value
        $labelTokens = [regex]::Matches($labelsRaw, '`([^`]+)`') | ForEach-Object { $_.Groups[1].Value }
        if (-not $labelTokens -or $labelTokens.Count -eq 0) {
            $labelTokens = $labelsRaw.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        }

        $bodyStart = $labelMatch.Index + $labelMatch.Length
        $body = $chunk.Substring($bodyStart).Trim()
        if (-not $body) {
            throw "Missing body for draft issue #$($m.Groups[1].Value)."
        }

        $issues += [pscustomobject]@{
            DraftId = [int]$m.Groups[1].Value
            Title   = Normalize-IssueTitle -Title $m.Groups[2].Value.Trim()
            Labels  = @($labelTokens)
            Body    = $body
        }
    }

    return $issues | Sort-Object DraftId
}

function Parse-Dependencies {
    param([string]$Content)

    $deps = @{}
    $section = [regex]::Match($Content, '(?ms)###\s+Blocking dependencies \(suggested\)\s*(.+?)\r?\n---')
    if (-not $section.Success) { return $deps }

    $lines = $section.Groups[1].Value -split "\r?\n"
    foreach ($line in $lines) {
        $lineMatch = [regex]::Match($line, '^\s*-\s*#(\d+)\s+blocked by\s+(.+?)\s*$')
        if (-not $lineMatch.Success) { continue }
        $draftId = [int]$lineMatch.Groups[1].Value
        $blockers = [regex]::Matches($lineMatch.Groups[2].Value, '#(\d+)') | ForEach-Object { [int]$_.Groups[1].Value }
        $deps[$draftId] = @($blockers)
    }

    return $deps
}

function Get-ExistingIssueMap {
    param([string]$RepoName)

    $map = @{}
    $json = & gh issue list --repo $RepoName --state all --limit 1000 --json number,title 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $json) {
        return $map
    }

    $items = $json | ConvertFrom-Json
    foreach ($item in $items) {
        if (-not $map.ContainsKey($item.title)) {
            $map[$item.title] = [int]$item.number
        }
    }
    return $map
}

$Repo = Get-Repo -InputRepo $Repo
if (-not (Test-Path $DraftFile)) {
    throw "Draft file not found: $DraftFile"
}

$raw = Get-Content -Path $DraftFile -Raw
$issues = Parse-Issues -Content $raw
$dependencies = Parse-Dependencies -Content $raw
$existingIssueMap = Get-ExistingIssueMap -RepoName $Repo

Write-Host "Repo: $Repo"
Write-Host "Draft file: $DraftFile"
Write-Host "Issues parsed: $($issues.Count)"

if ($DryRun) {
    Write-Host "DryRun enabled. No GitHub changes will be made."
    foreach ($issue in $issues) {
        if ($existingIssueMap.ContainsKey($issue.Title)) {
            Write-Host ("- #{0}: SKIP (exists as #{1}) {2}" -f $issue.DraftId, $existingIssueMap[$issue.Title], $issue.Title)
        } else {
            Write-Host ("- #{0}: CREATE {1}" -f $issue.DraftId, $issue.Title)
        }
    }
    exit 0
}

# Ensure labels exist (safe if already present).
$allLabels = $issues | ForEach-Object Labels | Sort-Object -Unique
foreach ($label in $allLabels) {
    & gh label create $label --repo $Repo --color "1f6feb" --description "Issue label" --force 2>$null | Out-Null
}

$createdMap = @{}
foreach ($issue in $issues) {
    if ($existingIssueMap.ContainsKey($issue.Title)) {
        $existing = [int]$existingIssueMap[$issue.Title]
        $createdMap[$issue.DraftId] = $existing
        Write-Host ("Skipping draft #{0}; already exists as issue #{1}" -f $issue.DraftId, $existing)
        continue
    }

    $tmpPayload = New-TemporaryFile
    $payload = @{
        title  = $issue.Title
        body   = $issue.Body
        labels = @($issue.Labels)
    }
    $payload | ConvertTo-Json -Depth 5 | Set-Content -Path $tmpPayload.FullName -Encoding UTF8

    $output = & gh api "repos/$Repo/issues" --method POST --header "Content-Type: application/json" --input $tmpPayload.FullName --jq ".number"
    Remove-Item -Path $tmpPayload.FullName -Force -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0 -or -not $output) {
        throw "Failed creating draft issue #$($issue.DraftId): $($issue.Title)"
    }

    $num = [int]$output.Trim()

    $createdMap[$issue.DraftId] = $num
    $existingIssueMap[$issue.Title] = $num
    Write-Host ("Created draft #{0} as GitHub issue #{1}" -f $issue.DraftId, $num)
}

# Add dependency comments after all issues are created.
foreach ($entry in $dependencies.GetEnumerator()) {
    $draftId = [int]$entry.Key
    if (-not $createdMap.ContainsKey($draftId)) { continue }

    $blockedIssueNumber = [int]$createdMap[$draftId]
    $blockers = @()
    foreach ($blockerDraftId in $entry.Value) {
        if ($createdMap.ContainsKey($blockerDraftId)) {
            $blockers += "#$($createdMap[$blockerDraftId])"
        } else {
            $blockers += "(missing draft #$blockerDraftId)"
        }
    }

    if ($blockers.Count -gt 0) {
        $comment = "Blocked by: " + ($blockers -join ", ")
        & gh issue comment $blockedIssueNumber --repo $Repo --body $comment | Out-Null
        Write-Host ("Commented dependencies on issue #{0}" -f $blockedIssueNumber)
    }
}

Write-Host "Done. Created $($issues.Count) issues."
