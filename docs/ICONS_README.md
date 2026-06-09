# Teams App Icons

This directory contains the required icons for Teams app deployment.

## Icon Files

### icon-color.png (192×192)
- **Purpose**: Full-color app icon displayed in Teams app gallery and sidebar
- **Size**: 192×192 pixels (exactly)
- **Format**: PNG with transparency
- **Specification**: [Microsoft Teams App Icon Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema#icons)
- **Current**: `icon-color.svg` (placeholder - convert to PNG)

### icon-outline.png (32×32)
- **Purpose**: Outline/monochrome icon displayed in Teams toolbar and command bar
- **Size**: 32×32 pixels (exactly)
- **Format**: PNG with transparency
- **Colors**: Black or dark gray on transparent background
- **Specification**: [Microsoft Teams App Icon Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema#icons)
- **Current**: `icon-outline.svg` (placeholder - convert to PNG)

## Converting SVG to PNG

### Option 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Convert color icon (192×192)
convert -background none -density 192 icon-color.svg -resize 192x192 icon-color.png

# Convert outline icon (32×32)
convert -background none -density 32 icon-outline.svg -resize 32x32 icon-outline.png
```

### Option 2: Using Inkscape

```bash
# Install Inkscape
brew install inkscape  # macOS
sudo apt-get install inkscape  # Linux

# Convert color icon
inkscape --export-filename=icon-color.png --export-width=192 --export-height=192 icon-color.svg

# Convert outline icon
inkscape --export-filename=icon-outline.png --export-width=32 --export-height=32 icon-outline.svg
```

### Option 3: Online Tools

- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)
- [Zamzar](https://www.zamzar.com/convert/svg-to-png/)

Upload the SVG files and set the exact dimensions (192×192 and 32×32).

### Option 4: Using Node.js

```bash
npm install -g svg2png

# Convert color icon
svg2png icon-color.svg icon-color.png 192 192

# Convert outline icon
svg2png icon-outline.svg icon-outline.png 32 32
```

## Design Guidelines

### Color Icon (192×192)
- Use vibrant, recognizable colors
- Include branding (logo, company colors)
- Should be visible at small sizes
- Recommended: Simple, bold design
- No text/labels

### Outline Icon (32×32)
- Monochrome (black/dark gray)
- High contrast with white background
- Simple, clean lines
- Recognizable at 32×32 size
- No small details that won't scale

## Icon Requirements

- **Format**: PNG (not JPG or SVG)
- **Color space**: RGB or RGBA
- **Transparency**: Yes, recommended
- **Dimensions**: Exact size (no padding/scaling in Teams)
- **File size**: Keep under 50 KB each
- **Quality**: Use at least 96 DPI for conversion

## Teams Manifest References

The icons are referenced in `src/manifest.json`:

```json
{
  "icons": {
    "color": "icon-color.png",
    "outline": "icon-outline.png"
  }
}
```

Both files must exist in the `public/` directory at deployment time.

## Production Notes

Before deploying to production:
1. ✅ Convert SVG placeholders to actual PNG files
2. ✅ Test icons display correctly at intended sizes
3. ✅ Verify icons meet Teams branding guidelines
4. ✅ Include icons in Teams app package (`.zip`)

The SVG files included here are placeholders and suitable for testing. For production, create professional icons that match your brand.

## Support

- [Microsoft Teams Icon Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema#icons)
- [Teams App Manifest Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Teams App Design Guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/design/design-teams-app-fundamentals)
