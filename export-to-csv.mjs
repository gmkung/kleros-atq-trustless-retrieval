import { writeFile } from "fs/promises";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

//Using a .env file for local development
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMODULES_DIR = join(__dirname, "submodules");

// Function to convert an array of Tag objects to a CSV string
function jsonToCSV(items) {
  if (!items.length) return "";
  const replacer = (key, value) => (value === null ? "" : value);
  const header = Object.keys(items[0]);
  const csv = [
    header.join(","),
    ...items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(",")
    ),
  ].join("\r\n");
  return csv;
}

async function fetchAndProcessSubmodules() {
  try {
    const submodules = await readdir(SUBMODULES_DIR);
    let allTags = [];

    for (const submodule of submodules) {
      const modulePath = join(
        SUBMODULES_DIR,
        submodule,
        "dist",
        "main.mjs"
      );
      try {
        const submoduleImport = await import(modulePath);
        const tags = await submoduleImport.returnTags(
          "1",
          process.env.THEGRAPH_API_KEY
        );
        if (Array.isArray(tags)) {
          allTags = allTags.concat(tags);
        } else {
          console.error(`Error fetching tags from ${submodule}`);
        }
      } catch (error) {
        console.error(`Error in processing submodule ${submodule}:`, error);
      }
    }

    if (allTags.length > 0) {
      const csv = jsonToCSV(allTags);
      await writeFile(join(__dirname, "tags.csv"), csv);
      console.log("Tags have been written to tags.csv");
    }
  } catch (error) {
    console.error("Error in fetchAndProcessSubmodules:", error);
  }
}

fetchAndProcessSubmodules();
