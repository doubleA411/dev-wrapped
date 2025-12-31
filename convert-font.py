#!/usr/bin/env python3
# Convert WOFF2 to TTF using fontTools
import sys
from fontTools.ttLib import TTFont

woff2_path = sys.argv[1]
ttf_path = sys.argv[2]

font = TTFont(woff2_path)
font.flavor = None  # Remove WOFF2 flavor
font.save(ttf_path)
print(f"Converted {woff2_path} to {ttf_path}")

