#!/bin/bash
SUBMODULES_DIR="submodules"

# Function to delete all submodules
delete_all_submodules() {
  if [ -f ".gitmodules" ] && [ -s ".gitmodules" ]; then
    git config --file .gitmodules --get-regexp path | awk '{ print $2 }' | while read submodule; do
      echo "Removing $submodule..."
      git submodule deinit -f -- "$submodule"
      git rm -f "$submodule"
      rm -rf ".git/modules/$submodule"
    done
    git commit -m "Removed submodules"
  fi
  rm -rf $SUBMODULES_DIR
}

# Delete all existing submodules
delete_all_submodules

# Create the submodule directory
mkdir -p $SUBMODULES_DIR

# API endpoint and compacted query
API_ENDPOINT="https://gateway-arbitrum.network.thegraph.com/api/f69cafa505f7915fe73291100cc4c48a/deployments/id/QmevWPSB6PYKWrQCfD52nNtgYoFN4cRA3Dq2MjMjyu9Q9L"
QUERY='{"query":"{litems(where:{registry:\"0xae6aaed5434244be3699c56e7ebc828194f26dc3\"}){itemID status key0 key1 key2}}"}'

# Use curl to execute GraphQL query
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$QUERY" $API_ENDPOINT)
HTTP_CODE=$(echo $RESPONSE | jq -r 'if .errors then "400" else "200" end')

echo "HTTP Status Code: $HTTP_CODE"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Error detected:" $(echo $RESPONSE | jq '.errors[].message') | tee -a error_log.txt
  exit 1
else
  PARSED_RESPONSE=$(echo $RESPONSE | jq '[.data.litems[] | {url: .key0, commit: .key1}]')
  echo $PARSED_RESPONSE
fi

# Iterate over each submodule entry
echo $PARSED_RESPONSE | jq -c '.[]' | while IFS=$'\n' read -r line; do
  URL=$(echo $line | jq -r '.url')
  COMMIT=$(echo $line | jq -r '.commit')
  DIR_NAME=$(basename $URL .git)

  echo "Adding and checking out $DIR_NAME..."
  git submodule add -f $URL $SUBMODULES_DIR/$DIR_NAME
  cd $SUBMODULES_DIR/$DIR_NAME
  git checkout $COMMIT

  if [ -f "package.json" ]; then
    yarn install && yarn build
  fi
  cd -
done
