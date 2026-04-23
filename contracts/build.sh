#!/usr/bin/env bash
set -euo pipefail

echo "Compiling AztecForge contracts..."
cd "$(dirname "$0")"

for contract in bounty reputation funding-pool peer-allocation hackathon quest; do
    echo "  Compiling $contract..."
    cd "$contract"
    aztec compile
    cd ..
done

echo "All contracts compiled."
