#!/usr/bin/env bash
set -euo pipefail

echo "Testing AztecForge contracts..."
cd "$(dirname "$0")"

for contract in bounty reputation funding-pool peer-allocation hackathon quest; do
    echo "  Testing $contract..."
    cd "$contract"
    aztec test
    cd ..
done

echo "All contract tests passed."
