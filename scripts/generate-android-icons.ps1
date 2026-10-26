Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'assets\icon.png'
$resPath = Join-Path $projectRoot 'android\app\src\main\res'
$source = [System.Drawing.Image]::FromFile($sourcePath)
$sizes = @{
  'mdpi' = 48
  'hdpi' = 72
  'xhdpi' = 96
  'xxhdpi' = 144
  'xxxhdpi' = 192
}

try {
  foreach ($density in $sizes.Keys) {
    $size = $sizes[$density]
    $folder = Join-Path $resPath "mipmap-$density"
    foreach ($round in @($false, $true)) {
      $bitmap = [System.Drawing.Bitmap]::new($size, $size)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $clip = $null
      try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.Clear([System.Drawing.Color]::Transparent)
        if ($round) {
          $clip = [System.Drawing.Drawing2D.GraphicsPath]::new()
          $clip.AddEllipse(0, 0, $size, $size)
          $graphics.SetClip($clip)
        }
        $graphics.DrawImage($source, 0, 0, $size, $size)
        $name = if ($round) { 'ic_launcher_round' } else { 'ic_launcher' }
        $bitmap.Save((Join-Path $folder "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
      } finally {
        if ($clip) { $clip.Dispose() }
        $graphics.Dispose()
        $bitmap.Dispose()
      }
      Remove-Item -LiteralPath (Join-Path $folder "$name.webp") -ErrorAction SilentlyContinue
    }
  }
} finally {
  $source.Dispose()
}
