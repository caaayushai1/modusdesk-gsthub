# scripts/show-captcha-dialog.ps1
# Always-On-Top Floating Action Dialog for ModusDesk GST Portal Login
param (
    [string]$Username = "Taxpayer",
    [string]$FlagPath = "",
    [string]$Title = "Action Required: Enter CAPTCHA & Click LOGIN",
    [string]$CustomMessage = ""
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# 1. Create Floating TopMost Form
$form = New-Object System.Windows.Forms.Form
$form.Text = "ModusDesk GST Companion — Action Required"
$form.Size = New-Object System.Drawing.Size(460, 195)
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.ShowInTaskbar = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 250, 252)

# Ensure window activates and forces to front when shown
$form.Add_Shown({
    $form.Activate()
    $form.BringToFront()
})

# Header Panel
$header = New-Object System.Windows.Forms.Panel
$header.Dock = [System.Windows.Forms.DockStyle]::Top
$header.Height = 50
$header.BackColor = [System.Drawing.Color]::FromArgb(16, 185, 129) # Emerald Green

$headerLabel = New-Object System.Windows.Forms.Label
$headerLabel.Text = "🔐 $Title"
$headerLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$headerLabel.ForeColor = [System.Drawing.Color]::White
$headerLabel.AutoSize = $false
$headerLabel.Size = New-Object System.Drawing.Size(430, 32)
$headerLabel.Location = New-Object System.Drawing.Point(15, 10)
$header.Controls.Add($headerLabel)
$form.Controls.Add($header)

# Body Label
$bodyLabel = New-Object System.Windows.Forms.Label
if ($CustomMessage -ne "") {
    $bodyLabel.Text = $CustomMessage
} else {
    $bodyLabel.Text = "Account: $Username`nEnter the CAPTCHA in Chrome. This popup will close automatically once logged in."
}
$bodyLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$bodyLabel.ForeColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$bodyLabel.Location = New-Object System.Drawing.Point(18, 65)
$bodyLabel.Size = New-Object System.Drawing.Size(420, 40)
$form.Controls.Add($bodyLabel)

# Close Button (Dismiss)
$btnClose = New-Object System.Windows.Forms.Button
$btnClose.Text = "Dismiss"
$btnClose.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$btnClose.BackColor = [System.Drawing.Color]::FromArgb(226, 232, 240)
$btnClose.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$btnClose.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnClose.FlatAppearance.BorderSize = 0
$btnClose.Size = New-Object System.Drawing.Size(90, 32)
$btnClose.Location = New-Object System.Drawing.Point(348, 112)
$btnClose.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnClose.Add_Click({ $form.Close() })
$form.Controls.Add($btnClose)

# Auto-close timer polling flag file
if ($FlagPath -ne "") {
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 500 # check every 500ms
    $timer.Add_Tick({
        if (Test-Path $FlagPath) {
            $timer.Stop()
            $form.Close()
        }
    })
    $timer.Start()
}

# Timeout after 3 minutes so it never stays forever
$timeoutTimer = New-Object System.Windows.Forms.Timer
$timeoutTimer.Interval = 180000
$timeoutTimer.Add_Tick({
    $timeoutTimer.Stop()
    $form.Close()
})
$timeoutTimer.Start()

# Sound notification
try {
    [System.Media.SystemSounds]::Asterisk.Play()
} catch {}

# Show dialog
$form.ShowDialog() | Out-Null
