#!/bin/bash

# Script to generate all icon assets from source images
# Requires ImageMagick (convert/magick command) and optionally rsvg-convert for SVG processing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PUBLIC_DIR="$SCRIPT_DIR/../public"

# Source files
LOGO_PNG="$SCRIPT_DIR/logo.png"
APP_SVG="$SCRIPT_DIR/app.svg"

echo -e "${GREEN}Starting icon generation...${NC}"

# Check if source files exist
if [ ! -f "$LOGO_PNG" ]; then
    echo -e "${RED}Error: logo.png not found at $LOGO_PNG${NC}"
    exit 1
fi

if [ ! -f "$APP_SVG" ]; then
    echo -e "${RED}Error: app.svg not found at $APP_SVG${NC}"
    exit 1
fi

# Check for ImageMagick
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick not found. Please install it:${NC}"
    echo "  macOS: brew install imagemagick"
    echo "  Linux: sudo apt-get install imagemagick"
    exit 1
fi

# Use 'magick' if available, otherwise fall back to 'convert'
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

echo -e "${YELLOW}Using command: $CONVERT_CMD${NC}"

# Create public directory if it doesn't exist
mkdir -p "$PUBLIC_DIR"

# Generate PNG icons from logo.png
echo -e "${GREEN}Generating PNG icons from logo.png...${NC}"

# PWA icons (192x192 and 512x512)
echo "  - icon-192x192.png"
$CONVERT_CMD "$LOGO_PNG" -resize 192x192 -background none -gravity center -extent 192x192 "$PUBLIC_DIR/icon-192x192.png"

echo "  - icon-512x512.png"
$CONVERT_CMD "$LOGO_PNG" -resize 512x512 -background none -gravity center -extent 512x512 "$PUBLIC_DIR/icon-512x512.png"

# Favicon sizes
echo "  - favicon-16x16.png"
$CONVERT_CMD "$LOGO_PNG" -resize 16x16 -background none -gravity center -extent 16x16 "$PUBLIC_DIR/favicon-16x16.png"

echo "  - favicon-32x32.png"
$CONVERT_CMD "$LOGO_PNG" -resize 32x32 -background none -gravity center -extent 32x32 "$PUBLIC_DIR/favicon-32x32.png"

echo "  - favicon-48x48.png"
$CONVERT_CMD "$LOGO_PNG" -resize 48x48 -background none -gravity center -extent 48x48 "$PUBLIC_DIR/favicon-48x48.png"

# Apple touch icons
echo "  - apple-touch-icon.png (180x180)"
$CONVERT_CMD "$LOGO_PNG" -resize 180x180 -background none -gravity center -extent 180x180 "$PUBLIC_DIR/apple-touch-icon.png"

# Android Chrome icons
echo "  - android-chrome-192x192.png"
$CONVERT_CMD "$LOGO_PNG" -resize 192x192 -background none -gravity center -extent 192x192 "$PUBLIC_DIR/android-chrome-192x192.png"

echo "  - android-chrome-512x512.png"
$CONVERT_CMD "$LOGO_PNG" -resize 512x512 -background none -gravity center -extent 512x512 "$PUBLIC_DIR/android-chrome-512x512.png"

# Generate favicon.ico with multiple sizes
echo "  - favicon.ico (multi-size)"
$CONVERT_CMD "$LOGO_PNG" -resize 16x16 -background none -gravity center -extent 16x16 \
    "$LOGO_PNG" -resize 32x32 -background none -gravity center -extent 32x32 \
    "$LOGO_PNG" -resize 48x48 -background none -gravity center -extent 48x48 \
    "$PUBLIC_DIR/favicon.ico"

# Generate Open Graph images
echo -e "${GREEN}Generating Open Graph images...${NC}"

echo "  - og-image.png (1200x630)"
$CONVERT_CMD "$LOGO_PNG" -resize 400x400 -background "#000000" -gravity center -extent 1200x630 "$PUBLIC_DIR/og-image.png"

echo "  - og-image-square.png (1200x1200)"
$CONVERT_CMD "$LOGO_PNG" -resize 800x800 -background "#000000" -gravity center -extent 1200x1200 "$PUBLIC_DIR/og-image-square.png"

echo "  - twitter-image.png (1200x600)"
$CONVERT_CMD "$LOGO_PNG" -resize 400x400 -background "#000000" -gravity center -extent 1200x600 "$PUBLIC_DIR/twitter-image.png"

# Generate SVG icons from app.svg
echo -e "${GREEN}Generating SVG icons from app.svg...${NC}"

# Check if we can use rsvg-convert for better SVG processing
if command -v rsvg-convert &> /dev/null; then
    echo "  - Using rsvg-convert for SVG processing"
    
    echo "  - icon-192x192.svg (as PNG from SVG)"
    rsvg-convert -w 192 -h 192 "$APP_SVG" -o "$PUBLIC_DIR/icon-192x192-from-svg.png"
    
    echo "  - icon-512x512.svg (as PNG from SVG)"
    rsvg-convert -w 512 -h 512 "$APP_SVG" -o "$PUBLIC_DIR/icon-512x512-from-svg.png"
else
    echo -e "${YELLOW}  - rsvg-convert not found. Using ImageMagick for SVG (may have lower quality)${NC}"
    echo "    To install: brew install librsvg"
    
    echo "  - icon-192x192.svg (as PNG from SVG)"
    $CONVERT_CMD -background none -density 300 "$APP_SVG" -resize 192x192 "$PUBLIC_DIR/icon-192x192-from-svg.png"
    
    echo "  - icon-512x512.svg (as PNG from SVG)"
    $CONVERT_CMD -background none -density 300 "$APP_SVG" -resize 512x512 "$PUBLIC_DIR/icon-512x512-from-svg.png"
fi

# Copy the SVG files directly
echo "  - icon-192x192.svg (original SVG)"
cp "$APP_SVG" "$PUBLIC_DIR/icon-192x192.svg"

echo "  - icon-512x512.svg (original SVG)"
cp "$APP_SVG" "$PUBLIC_DIR/icon-512x512.svg"

# Generate a summary
echo ""
echo -e "${GREEN}✓ Icon generation complete!${NC}"
echo ""
echo "Generated files in $PUBLIC_DIR:"
ls -lh "$PUBLIC_DIR"/*.png "$PUBLIC_DIR"/*.ico "$PUBLIC_DIR"/*.svg 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo ""
echo -e "${GREEN}Done!${NC}"
