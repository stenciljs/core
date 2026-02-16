#!/bin/bash
set -e

# Git History Preservation Migration Script
# Migrates files from src/ to packages/*/src/ while preserving git history
#
# Strategy:
# 1. For each file in packages/*/src/, find its legacy counterpart in src/
# 2. Save the new content
# 3. Remove the new file
# 4. git mv the legacy file to the new location
# 5. Restore the new content
#
# Usage: ./scripts/migrate-git-history.sh [--dry-run]

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "=== DRY RUN MODE ==="
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Temp directory for storing new content
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Repo root: $REPO_ROOT"
echo "Temp dir: $TEMP_DIR"
echo ""

# Counters
MATCHED=0
SKIPPED=0
FAILED=0

# Mapping function: given a new path in packages/, return the legacy path in src/
get_legacy_path() {
    local new_path="$1"
    local legacy_path=""

    # packages/cli/src/* -> src/cli/*
    if [[ "$new_path" == packages/cli/src/* ]]; then
        legacy_path="src/cli/${new_path#packages/cli/src/}"

    # packages/mock-doc/src/* -> src/mock-doc/*
    elif [[ "$new_path" == packages/mock-doc/src/* ]]; then
        legacy_path="src/mock-doc/${new_path#packages/mock-doc/src/}"

    # packages/core/src/server/* -> src/hydrate/*
    elif [[ "$new_path" == packages/core/src/server/* ]]; then
        legacy_path="src/hydrate/${new_path#packages/core/src/server/}"

    # packages/core/src/* -> src/* (compiler, runtime, client, utils, etc.)
    elif [[ "$new_path" == packages/core/src/* ]]; then
        legacy_path="src/${new_path#packages/core/src/}"
    fi

    # Handle _test_ -> test directory rename
    legacy_path="${legacy_path//_test_/test}"

    echo "$legacy_path"
}

# Find all TypeScript/TSX files in packages/*/src/
echo "=== Finding files to migrate ==="
echo ""

# Process each new file
find packages -path "*/src/*" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort | while read -r new_path; do
    legacy_path=$(get_legacy_path "$new_path")

    if [[ -z "$legacy_path" ]]; then
        echo "SKIP (no mapping): $new_path"
        ((SKIPPED++)) || true
        continue
    fi

    if [[ ! -f "$legacy_path" ]]; then
        echo "SKIP (no legacy): $new_path"
        echo "  -> Expected: $legacy_path"
        ((SKIPPED++)) || true
        continue
    fi

    echo "MATCH: $legacy_path -> $new_path"
    ((MATCHED++)) || true

    if [[ "$DRY_RUN" == "false" ]]; then
        # Create temp directory structure
        temp_file="$TEMP_DIR/$new_path"
        mkdir -p "$(dirname "$temp_file")"

        # Save new content
        cp "$new_path" "$temp_file"

        # Remove the new file (it has no history anyway)
        rm "$new_path"

        # Ensure target directory exists
        mkdir -p "$(dirname "$new_path")"

        # git mv the legacy file to new location
        git mv "$legacy_path" "$new_path"

        # Restore new content
        cp "$temp_file" "$new_path"
    fi
done

echo ""
echo "=== Summary ==="
echo "Run with --dry-run first to see what will be migrated"
echo ""
echo "After running without --dry-run:"
echo "  git add -A"
echo "  git status"
echo "  git commit -m 'chore: migrate to monorepo structure (preserve git history)'"
