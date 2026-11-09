# Draws Studio's toolbar icons into content/icons. They are ordinary 24x24 PNGs:
# replace any of them by hand, or edit the drawings here and run this again.
#
#   powershell -ExecutionPolicy Bypass -File studio\Tools\make-icons.ps1

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$directory = Join-Path $root "content\icons"
New-Item -ItemType Directory -Force -Path $directory | Out-Null

function Colour([int]$r, [int]$g, [int]$b) {
  return [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
}

function Brush([int]$r, [int]$g, [int]$b) {
  return New-Object System.Drawing.SolidBrush (Colour $r $g $b)
}

function Pen([int]$r, [int]$g, [int]$b, [int]$width = 1) {
  return New-Object System.Drawing.Pen (Colour $r $g $b), $width
}

function Points([object[]]$pairs) {
  $points = @()
  for ($i = 0; $i -lt $pairs.Count; $i += 2) {
    $points += New-Object System.Drawing.Point $pairs[$i], $pairs[$i + 1]
  }
  return [System.Drawing.Point[]]$points
}

function Save-Icon([string]$name, [scriptblock]$draw) {
  $bitmap = New-Object System.Drawing.Bitmap 24, 24
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  $graphics.Clear([System.Drawing.Color]::Transparent)
  & $draw $graphics
  $graphics.Dispose()
  $path = Join-Path $directory ($name + ".png")
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
  Write-Host "wrote $path"
}

Save-Icon "new" {
  param($g)
  $page = Brush 255 255 255
  $edge = Pen 55 55 55
  $fold = Brush 198 214 236
  $ink = Pen 45 105 190 2
  $g.FillRectangle($page, 5, 2, 13, 19)
  $g.FillPolygon($fold, (Points @(13,2, 18,7, 13,7)))
  $g.DrawRectangle($edge, 5, 2, 12, 18)
  $g.DrawLine($edge, 13, 2, 13, 7)
  $g.DrawLine($edge, 13, 7, 18, 7)
  $g.DrawLine($ink, 8, 11, 15, 11)
  $g.DrawLine($ink, 8, 15, 15, 15)
  $page.Dispose(); $edge.Dispose(); $fold.Dispose(); $ink.Dispose()
}

Save-Icon "open" {
  param($g)
  $folder = Brush 246 200 80
  $edge = Pen 122 92 22
  $g.FillPolygon($folder, (Points @(3,8, 3,5, 9,5, 11,8)))
  $g.FillRectangle($folder, 3, 8, 18, 12)
  $g.DrawLine($edge, 3, 5, 9, 5)
  $g.DrawLine($edge, 9, 5, 11, 8)
  $g.DrawRectangle($edge, 3, 8, 17, 11)
  $folder.Dispose(); $edge.Dispose()
}

Save-Icon "save" {
  param($g)
  $body = Brush 68 108 178
  $label = Brush 255 255 255
  $shutter = Brush 208 208 208
  $edge = Pen 30 48 86
  $g.FillRectangle($body, 3, 3, 18, 18)
  $g.FillRectangle($label, 7, 12, 10, 7)
  $g.FillRectangle($shutter, 7, 4, 10, 6)
  $g.DrawRectangle($edge, 3, 3, 17, 17)
  $g.DrawRectangle($edge, 7, 12, 9, 6)
  $body.Dispose(); $label.Dispose(); $shutter.Dispose(); $edge.Dispose()
}

Save-Icon "undo" {
  param($g)
  $ink = Pen 40 90 180 3
  $g.DrawArc($ink, 5, 5, 15, 15, 30, 150)
  $g.FillPolygon((Brush 40 90 180), (Points @(4,7, 11,7, 6,14)))
  $ink.Dispose()
}

Save-Icon "redo" {
  param($g)
  $ink = Pen 40 90 180 3
  $g.DrawArc($ink, 4, 5, 15, 15, 0, 150)
  $g.FillPolygon((Brush 40 90 180), (Points @(20,7, 13,7, 18,14)))
  $ink.Dispose()
}

Save-Icon "select" {
  param($g)
  $fill = Brush 255 255 255
  $edge = Pen 30 30 30
  $arrow = Points @(6,2, 6,18, 10,14, 13,21, 16,19, 13,12, 19,12)
  $g.FillPolygon($fill, $arrow)
  $g.DrawPolygon($edge, $arrow)
  $fill.Dispose(); $edge.Dispose()
}

Save-Icon "move" {
  param($g)
  $ink = Pen 45 45 45 2
  $fill = Brush 45 45 45
  $g.DrawLine($ink, 12, 4, 12, 20)
  $g.DrawLine($ink, 4, 12, 20, 12)
  $g.DrawPolygon($ink, (Points @(12,2, 9,7, 15,7)))
  $g.DrawPolygon($ink, (Points @(12,22, 9,17, 15,17)))
  $g.DrawPolygon($ink, (Points @(2,12, 7,9, 7,15)))
  $g.DrawPolygon($ink, (Points @(22,12, 17,9, 17,15)))
  $ink.Dispose(); $fill.Dispose()
}

Save-Icon "scale" {
  param($g)
  $ink = Pen 45 45 45
  $edge = Pen 45 110 180 2
  $g.DrawRectangle($ink, 4, 10, 10, 10)
  $g.DrawLine($edge, 6, 18, 18, 6)
  $g.FillRectangle((Brush 45 45 45), 2, 16, 4, 4)
  $g.FillRectangle((Brush 45 45 45), 16, 2, 4, 4)
  $ink.Dispose(); $edge.Dispose()
}

Save-Icon "rotate" {
  param($g)
  $ink = Pen 45 110 180 3
  $g.DrawArc($ink, 4, 4, 16, 16, 210, 270)
  $g.FillPolygon((Brush 45 110 180), (Points @(5,6, 12,5, 8,12)))
  $ink.Dispose()
}

Save-Icon "part" {
  param($g)
  $top = Brush 214 214 214
  $front = Brush 168 168 168
  $side = Brush 128 128 128
  $edge = Pen 48 48 48
  $g.FillPolygon($top, (Points @(4,8, 8,4, 22,4, 18,8)))
  $g.FillPolygon($side, (Points @(18,8, 22,4, 22,16, 18,20)))
  $g.FillRectangle($front, 4, 8, 14, 12)
  $g.DrawPolygon($edge, (Points @(4,8, 8,4, 22,4, 18,8, 4,8)))
  $g.DrawPolygon($edge, (Points @(18,8, 22,4, 22,16, 18,20)))
  $g.DrawRectangle($edge, 4, 8, 14, 12)
  $top.Dispose(); $front.Dispose(); $side.Dispose(); $edge.Dispose()
}

Save-Icon "sphere" {
  param($g)
  $ball = Brush 150 190 230
  $shine = Brush 240 248 255
  $edge = Pen 48 70 100
  $g.FillEllipse($ball, 3, 3, 18, 18)
  $g.FillEllipse($shine, 7, 6, 5, 4)
  $g.DrawEllipse($edge, 3, 3, 18, 18)
  $ball.Dispose(); $shine.Dispose(); $edge.Dispose()
}

Save-Icon "cylinder" {
  param($g)
  $body = Brush 168 168 168
  $top = Brush 214 214 214
  $edge = Pen 48 48 48
  $g.FillRectangle($body, 6, 6, 12, 12)
  $g.FillEllipse($top, 6, 3, 12, 7)
  $g.FillEllipse($body, 6, 14, 12, 7)
  $g.DrawRectangle($edge, 6, 6, 12, 12)
  $g.DrawEllipse($edge, 6, 3, 12, 7)
  $g.DrawEllipse($edge, 6, 14, 12, 7)
  $body.Dispose(); $top.Dispose(); $edge.Dispose()
}

Save-Icon "wedge" {
  param($g)
  $face = Brush 178 178 178
  $side = Brush 138 138 138
  $edge = Pen 48 48 48
  $g.FillPolygon($face, (Points @(4,20, 4,5, 20,20)))
  $g.FillPolygon($side, (Points @(4,5, 10,5, 20,20, 20,20)))
  $g.DrawPolygon($edge, (Points @(4,20, 4,5, 20,20)))
  $g.DrawLine($edge, 4, 5, 10, 5)
  $g.DrawLine($edge, 10, 5, 20, 20)
  $face.Dispose(); $side.Dispose(); $edge.Dispose()
}

Save-Icon "play" {
  param($g)
  $green = Brush 60 156 60
  $edge = Pen 26 78 26
  $triangle = Points @(6,3, 20,12, 6,21)
  $g.FillPolygon($green, $triangle)
  $g.DrawPolygon($edge, $triangle)
  $green.Dispose(); $edge.Dispose()
}
