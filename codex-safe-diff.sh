#!/bin/bash
echo "### ONLY TEXT CHANGES (Codex safe)"
echo "Assets added (not included):"
echo "- favicon.ico"
echo "- apple-touch-icon.png"
echo "- assets/og-image.png"
echo
echo "HTML/CSS/JS diff follows:"
git diff -- '*.html' '*.css' '*.js'
