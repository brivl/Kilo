#!/bin/sh
set -e

STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

echo "pre-commit: running prettier + eslint --fix on staged files"

echo "$STAGED" | tr '\n' '\0' | xargs -0 npx prettier --write --ignore-unknown
echo "$STAGED" | tr '\n' '\0' | xargs -0 npx eslint --fix --no-warn-ignored 2>/dev/null || true

echo "$STAGED" | tr '\n' '\0' | xargs -0 git add
