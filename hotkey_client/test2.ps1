$key  = [Byte][Char]'K' ## Shout hotkey
$held = $false
$Signature = @'
    [DllImport("user32.dll", CharSet=CharSet.Auto, ExactSpelling=true)] 
    public static extern short GetAsyncKeyState(int virtualKeyCode); 
'@
Add-Type -MemberDefinition $Signature -Name Keyboard -Namespace PsOneApi
do
{
    If( [bool]([PsOneApi.Keyboard]::GetAsyncKeyState($key) -lt 0) -and $held -eq $false)
    { 
        $held = $true
        Write-Host "Shout start" -ForegroundColor Green 
    }
    If ( [bool]([PsOneApi.Keyboard]::GetAsyncKeyState($key) -ge 0) -and $held -eq $true )
    {
        $held = $false
        Write-Host "Shout end" -ForegroundColor Red 
    }
    
    Start-Sleep -Milliseconds 100

} while($true)