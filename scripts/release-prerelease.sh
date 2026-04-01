#!/bin/bash
set -e

# Release script for prerelease versions (alpha, beta, rc)
# Usage: ./scripts/release-prerelease.sh [tag]
# Example: ./scripts/release-prerelease.sh alpha

TAG=${1:-alpha}

echo "🚀 Starting prerelease for tag: $TAG"

# Validate tag
if [[ ! "$TAG" =~ ^(alpha|beta|rc)$ ]]; then
  echo "❌ Invalid tag: $TAG. Must be one of: alpha, beta, rc"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Bump prerelease version in all packages (lockstep)
echo "⬆️  Bumping prerelease version..."

# Bump root package.json
npm version prerelease --preid=$TAG --no-git-tag-version

# Bump all workspace packages
pnpm -r exec npm version prerelease --preid=$TAG --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📦 New version: $NEW_VERSION"

# Build all packages
echo "🔨 Building packages..."
pnpm build

# Publish all packages with the prerelease tag
echo "📤 Publishing packages with tag: $TAG"
pnpm -r publish --tag $TAG --access public --no-git-checks

echo "✅ Released $NEW_VERSION with tag: $TAG"
