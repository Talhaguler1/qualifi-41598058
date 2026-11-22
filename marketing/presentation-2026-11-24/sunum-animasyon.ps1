# Adds the cover animation (mask flies in from the bottom-right, glow fades in) and exports a PDF.
param([string]$File)
$pp = New-Object -ComObject PowerPoint.Application
$p = $pp.Presentations.Open($File, $false, $false, $false)
$sl = $p.Slides.Item(1)
$mask = $null; $glow = $null
foreach ($sh in $sl.Shapes) { if ($sh.Name -eq "Kapak maskesi") { $mask = $sh }; if ($sh.Name -eq "Kapak isigi") { $glow = $sh } }
$seq = $sl.TimeLine.MainSequence
$e1 = $seq.AddEffect($mask, 2, 0, 2)      # Fly in, with previous (starts on slide load)
$e1.EffectParameters.Direction = 8        # from bottom-right
$e1.Timing.Duration = 1.3
$e1.Timing.Decelerate = 0.7
$e2 = $seq.AddEffect($glow, 10, 0, 2)     # Fade in, with previous
$e2.Timing.Duration = 1.6
$e2.Timing.TriggerDelayTime = 0.3
"mask=$($mask.Name) glow=$($glow.Name) effects=$($seq.Count)"
$p.Save()
$p.SaveAs(($File -replace '\.pptx$', '.pdf'), 32)
$p.Close(); $pp.Quit()
