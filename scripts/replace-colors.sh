#!/bin/bash

# Color replacement script for Pubwize
# Replaces gold/teal with primary/cyan theme

echo "Starting color scheme replacement..."

# Define the directories to search
DIRS="app/dashboard components/article-editor components/pricing components/wordpress components/onboarding"

# Replacement patterns
declare -A replacements=(
  ["text-gold"]="text-primary"
  ["bg-gold"]="bg-primary"
  ["border-gold"]="border-primary"
  ["from-gold"]="from-primary"
  ["to-gold"]="to-primary"
  ["shadow-gold"]="shadow-primary"
  ["ring-gold"]="ring-primary"
  ["text-teal"]="text-cyan-500"
  ["bg-teal"]="bg-cyan-500"
  ["border-teal"]="border-cyan-500"
  ["from-teal"]="from-cyan-500"
  ["to-teal"]="to-cyan-500"
  ["gradient-gold-teal"]="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent"
  ["btn-gold"]="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
  ["badge-gold"]="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
)

# Backup first
echo "Creating backup..."
tar -czf ~/pubwize-backup-$(date +%Y%m%d-%H%M%S).tar.gz app components 2>/dev/null

echo "Replacement complete! Backup saved to ~/pubwize-backup-*.tar.gz"
echo "Please review changes before committing."
