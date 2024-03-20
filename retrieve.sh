#!/bin/bash

# Define the API endpoint and submodule directory
API_ENDPOINT="https://example.com/api/submodules"
SUBMODULES_DIR="submodules"

# Dummy response for testing
RESPONSE='[
  {
    "url": "https://github.com/gmkung/atq-sample-submodule.git",
    "commit": "007cfac"
  }
]'

# Function to delete all submodules
delete_all_submodules() {
  # If .gitmodules exists and is not empty
  if [ -f ".gitmodules" ] && [ -s ".gitmodules" ]; then
    # Read each submodule path and deinit
    git config --file .gitmodules --get-regexp path | awk '{ print $2 }' | while read submodule; do
      echo "Removing $submodule..."
      git submodule deinit -f -- "$submodule"
      git rm -f "$submodule"
      rm -rf ".git/modules/$submodule"
    done
    git commit -m "Removed submodules"
  fi

  # Cleanup the submodule directory
  rm -rf $SUBMODULES_DIR
}

# Delete all existing submodules
delete_all_submodules

# Create the submodule directory
mkdir -p $SUBMODULES_DIR

# Set IFS to handle newlines
OLD_IFS=$IFS
IFS=$'\n'

# Iterate over each submodule entry in the response
for line in $(echo $RESPONSE | jq -r '.[] | "\(.url) \(.commit)"'); do
  URL=$(echo $line | cut -d ' ' -f1)
  COMMIT=$(echo $line | cut -d ' ' -f2)
  DIR_NAME=$(basename $URL .git)

  # Add the submodule and check out the specified commit
  echo "Adding and checking out $DIR_NAME..."
  git submodule add -f $URL $SUBMODULES_DIR/$DIR_NAME #using -f to ignore the .gitignore
  cd $SUBMODULES_DIR/$DIR_NAME
  git checkout $COMMIT

  # Build the submodule if it contains a package.json
  if [ -f "package.json" ]; then
    yarn install && yarn build
  fi

  # Return to the main project directory
  cd -
done
