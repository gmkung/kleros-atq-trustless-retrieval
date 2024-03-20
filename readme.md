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

1. **Make the Retrieve Script Executable**:  
   The `retrieve.sh` script is used to fetch submodule information and update them accordingly. First, you need to change the permissions of the script to make it executable. Run the following command in your terminal:

```chmod +x retrieve.sh```

2. **Run the Retrieve Script:**
Once the script is executable, you can run it to fetch and update the submodules. Execute the script by running:

```./retrieve.sh```

This script will clone or pull the submodules and ensure they are checked out to the specified commit.

3. **Export Tags to CSV:**
After updating the submodules, run the export-to-csv.mjs script to process the submodule data and export the tags to a CSV file. Execute the script using Node.js:

```node export-to-csv.mjs```

This will aggregate data from the submodules and generate a tags.csv file in the current directory.