import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Directory containing the CSV files relative to the script's location
const csvDirectory = path.resolve(__dirname, '../exports');
const outputFile = path.resolve(__dirname, '../merged_output.csv');
// Function to read CSV file and return parsed data
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                Papa.parse(data, {
                    header: true,
                    complete: (results) => {
                        resolve(results.data);
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            }
        });
    });
};
// Main function to merge CSV files
const mergeCSVFiles = async (directory, output) => {
    const files = fs.readdirSync(directory).filter(file => file.endsWith('.csv'));
    const dataPromises = files.map(file => readCSV(path.join(directory, file)));
    const csvData = await Promise.all(dataPromises);
    // Get unique headers from all files
    const allHeaders = new Set();
    csvData.forEach(data => {
        if (data.length > 0) {
            Object.keys(data[0]).forEach(header => allHeaders.add(header));
        }
    });
    const uniqueHeaders = Array.from(allHeaders);
    // Combine data with unique headers
    const mergedData = csvData.flat().map(row => {
        const newRow = {};
        uniqueHeaders.forEach(header => {
            newRow[header] = row[header] || '';
        });
        return newRow;
    });
    // Convert merged data to CSV
    const csvOutput = Papa.unparse(mergedData, { columns: uniqueHeaders });
    // Write the merged CSV to output file
    fs.writeFileSync(output, csvOutput);
    console.log('All CSV files have been merged successfully into', output);
};
// Run the merging function
mergeCSVFiles(csvDirectory, outputFile);
