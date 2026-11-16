# scripts/bring-to-front.ps1
# Bulletproof Windows 10/11 Foreground Activator for ModusDesk GST Companion
param (
    [string]$TargetTitle = ""
)

$win32Code = @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class Win32Foreground {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    private static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    private const uint SWP_NOMOVE = 0x0002;
    private const uint SWP_NOSIZE = 0x0001;
    private const uint SWP_SHOWWINDOW = 0x0040;

    public static List<IntPtr> FindGstWindows(string filterTitle) {
        var results = new List<IntPtr>();
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;

            var sbTitle = new StringBuilder(512);
            GetWindowText(hWnd, sbTitle, 512);
            var title = sbTitle.ToString();

            var sbClass = new StringBuilder(256);
            GetClassName(hWnd, sbClass, 256);
            var cls = sbClass.ToString();

            if (string.IsNullOrWhiteSpace(title)) return true;

            // Check if title or class matches
            bool isBrowser = cls.Contains("Chrome") || cls.Contains("Edge") || cls.Contains("Mozilla") || cls.Contains("ApplicationFrameWindow");
            bool titleMatches = false;

            if (!string.IsNullOrEmpty(filterTitle)) {
                titleMatches = title.IndexOf(filterTitle, StringComparison.OrdinalIgnoreCase) >= 0;
            } else {
                titleMatches = title.IndexOf("Goods", StringComparison.OrdinalIgnoreCase) >= 0
                            || title.IndexOf("GST", StringComparison.OrdinalIgnoreCase) >= 0
                            || title.IndexOf("Tax", StringComparison.OrdinalIgnoreCase) >= 0
                            || title.IndexOf("Login", StringComparison.OrdinalIgnoreCase) >= 0;
            }

            if (isBrowser && titleMatches) {
                results.Add(hWnd);
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }

    public static bool ActivateWindow(IntPtr hWnd) {
        try {
            // Bypass Windows foreground lock via ALT key simulation
            keybd_event(0x12, 0, 0, 0); // VK_MENU down
            keybd_event(0x12, 0, 2, 0); // VK_MENU up

            // Restore if minimized, then elevate Z-order
            ShowWindow(hWnd, 9); // SW_RESTORE = 9
            SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
            SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);

            // Grant focus
            SetForegroundWindow(hWnd);
            SwitchToThisWindow(hWnd, true);
            return true;
        } catch {
            return false;
        }
    }
}
"@

Add-Type -TypeDefinition $win32Code -ErrorAction SilentlyContinue

$matched = [Win32Foreground]::FindGstWindows($TargetTitle)
if ($matched.Count -gt 0) {
    foreach ($hwnd in $matched) {
        [Win32Foreground]::ActivateWindow($hwnd)
    }
    Write-Output "SUCCESS: Activated $($matched.Count) window(s)."
} else {
    # Fallback to WScript AppActivate for maximum compatibility
    $wsh = New-Object -ComObject WScript.Shell
    $activated = $wsh.AppActivate("Goods & Services Tax")
    if (-not $activated) {
        $activated = $wsh.AppActivate("GST")
    }
    if ($activated) {
        Write-Output "SUCCESS: Activated via WScript.Shell."
    } else {
        Write-Output "NOT_FOUND: No matching window."
    }
}
