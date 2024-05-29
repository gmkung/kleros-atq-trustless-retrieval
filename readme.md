# Address Tags Query Submodule

This repository contains scripts and modules for the Address Tags Query submodule. Follow the instructions below to set up and run the scripts to fetch data from submodules and export tags to a CSV file.

## Prerequisites

Before running the scripts, ensure you have the following installed:

- Git
- Node.js (Version 14 or higher recommended)
- Yarn package manager

## Getting Started

Clone this repository and navigate to the directory where the repository has been cloned.

## Setting Up and Running the Scripts

0. Create a .env file locally with the The Graph's API Key under the variable ```THEGRAPH_API_KEY```.

1. **Make the Retrieve Script Executable**:  
   The `retrieve.sh` script is used to fetch submodule information and update them accordingly. First, you need to change the permissions of the script to make it executable. Run the following command in your terminal:

```chmod +x 1_fetch.sh 2_pull_submodules.sh```

2. **Run the Retrieve Script:**
Once the script is executable, you can run it to fetch and update the submodules. Execute the script by running:

```./1_fetch.sh && ./2_pull_submodules.sh```

This script will clone or pull the submodules and ensure they are checked out to the specified commit.

3. **Export Tags to CSV:**
After updating the submodules, run the export-to-csv.mjs script to process the submodule data and export the tags to a CSV file. Execute the script using Node.js.

For outputting the data in the format that Etherscan requires, use:
```yarn build && yarn start```
which will generate a tags-etherscan.csv file.

If you just want to repeat the pull of all the modules and data again, combine all steps together with:

```./1_fetch.sh && ./2_pull_submodules.sh && yarn build && yarn start```

4. **Counting number of entries**
If you want to find out the total number of contract tags that were retrieved by all the approved ATQ entries, run this (at the root directory).
```find ./dist/exports -name "*.csv" -type f -exec sh -c 'total=0; for file do count=$(grep -c "" "$file"); echo "$file: $count lines"; total=$((total + count)); done; echo "Total: $total lines"' sh {} + ```
