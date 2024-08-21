#!/bin/bash

# Check if three arguments are provided
if [ "$#" -ne 3 ]; then
    echo "You must enter exactly three arguments (1. Github repo URL, 2. The commit ID to check 3. The ChainID to test)."
    echo "Usage: ./unit_test.sh <arg1> <arg2> <arg3>"
    exit 1
fi

# Capture the arguments
url=$1
commit=$2
chainId=$3

# Create the JSON content
json_content=$(cat <<EOF
[
  {
    "url": "$url",
    "commit": "$commit",
    "chainId": "$chainId"
  }
]
EOF
)

# Write the JSON content to a file
output_file="data.json"
echo "$json_content" > "$output_file"

echo "JSON file has been created as $output_file"

# Script to retrieve the modules as git submodules locally
echo "Retrieving the submodule(s) to test"
./2_pull_submodules.sh

# Building+Running the module and formatting the data for export to Etherscan
echo "Building the script"
yarn tsc --project ./tsconfig.json

echo "Running the module(s) and formatting the data for Etherscan"
node dist/src/3_export-to-csv-etherscan-v2.mjs

echo "Done! Look in dist/exports/ for the exported file."
