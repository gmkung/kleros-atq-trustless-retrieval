#!/bin/bash
# Fetch data from The Graph API and store it in data.json

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

API_ENDPOINT="https://gateway-arbitrum.network.thegraph.com/api/${THEGRAPH_API_KEY}/deployments/id/QmeregtvXdwydExdwVBs5YEwNV4HC1DKqQoyRgTbkbvFA7"
#API_ENDPOINT="https://api.studio.thegraph.com/query/61738/legacy-curate-gnosis/version/latest"
QUERY='{
  "query": "{ litems(first: 1000, skip: 0, orderBy: latestRequestSubmissionTime, where: {status: Registered, registryAddress: \"0xae6aaed5434244be3699c56e7ebc828194f26dc3\"}) { itemID metadata { props { type label value } } } }"
}'
DATA_FILE="data.json"

# Use curl to execute GraphQL query
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$QUERY" $API_ENDPOINT)

HTTP_CODE=$(echo $RESPONSE | jq -r 'if .errors then "400" else "200" end')

echo "HTTP Status Code: $HTTP_CODE"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Error detected:" $(echo $RESPONSE | jq '.errors[].message') | tee -a error_log.txt
  exit 1
else
  PARSED_RESPONSE=$(echo $RESPONSE | jq '[.data.litems[] | {
    itemID: .itemID,
    url: (.metadata.props[] | select(.label == "Github Repository URL").value),
    commit: (.metadata.props[] | select(.label == "Commit hash").value),
    chainId: (.metadata.props[] | select(.label == "EVM Chain ID").value)
  }]')
  echo $PARSED_RESPONSE >$DATA_FILE
fi
