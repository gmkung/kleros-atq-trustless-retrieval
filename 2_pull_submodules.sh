#!/bin/bash
# Manage Git submodules based on data from data.json

SUBMODULES_DIR="submodules"
DATA_FILE="data.json"

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

# Check if data file exists
if [ ! -f "$DATA_FILE" ]; then
    echo "Data file $DATA_FILE does not exist."
    exit 1
fi

# Read JSON data and iterate over each entry
jq -c '.[]' $DATA_FILE | while IFS=$'\n' read -r line; do
    URL=$(echo $line | jq -r '.url')
    COMMIT=$(echo $line | jq -r '.commit')

    # Validate URL format
    if [[ ! $URL =~ ^https?:// ]]; then
        echo "Invalid URL format: $URL - skipping..."
        continue
    fi

    DIR_NAME=$(basename $URL .git)-$COMMIT

    echo "Adding and checking out $DIR_NAME..."
    if ! git submodule add -f $URL $SUBMODULES_DIR/$DIR_NAME; then
        echo "Failed to add submodule for $URL - skipping..."
        continue
    fi

    cd $SUBMODULES_DIR/$DIR_NAME || {
        echo "Failed to change directory to $SUBMODULES_DIR/$DIR_NAME - skipping..."
        continue
    }

    if ! git checkout $COMMIT; then
        echo "Failed to checkout commit $COMMIT - skipping..."
        cd - >/dev/null
        continue
    fi

    if [ -f "package.json" ]; then
        yarn install && yarn build
    fi
    cd - >/dev/null
done
