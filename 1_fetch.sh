#!/bin/bash
# Fetch data from The Graph API and store it in data.json

API_ENDPOINT="https://gateway-arbitrum.network.thegraph.com/api/f69cafa505f7915fe73291100cc4c48a/deployments/id/QmevWPSB6PYKWrQCfD52nNtgYoFN4cRA3Dq2MjMjyu9Q9L"
QUERY='{"query":"{litems(where:{registry:\"0xae6aaed5434244be3699c56e7ebc828194f26dc3\"}){itemID status key0 key1 key2}}"}'
DATA_FILE="data.json"

# Use curl to execute GraphQL query
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$QUERY" $API_ENDPOINT)
HTTP_CODE=$(echo $RESPONSE | jq -r 'if .errors then "400" else "200" end')

echo "HTTP Status Code: $HTTP_CODE"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Error detected:" $(echo $RESPONSE | jq '.errors[].message') | tee -a error_log.txt
  exit 1
else
  PARSED_RESPONSE=$(echo $RESPONSE | jq '[.data.litems[] | {url: .key0, commit: .key1, chainId: .key2}]')
  echo $PARSED_RESPONSE > $DATA_FILE
fi