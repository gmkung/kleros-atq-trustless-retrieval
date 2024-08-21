import { writeFile } from "fs/promises";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

//Using a .env file for local development
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMODULES_DIR = join(__dirname, "submodules");

function chainIdToExplorer(chainId) {
  const chainMap = {
    1: "etherscan.io",
    10: "Optimistic.etherscan.io",
    56: "bscscan.com",
    100: "gnosisscan.io",
    137: "polygonscan.com",
    8453: "basescan.org",
    42161: "arbiscan.io",
    1284: "moonscan.io",
    59144: "lineascan.build",
    250: "ftmscan.com",
    324: "era.zksync.network",
    1285: "moonriver.moonscan.io",
    43114: "snowscan.xyz",
    25: "cronoscan.com",
    199: "bttcscan.com",
    1101: "zkevm.polygonscan.com",
    1111: "wemixscan.com",
    534352: "scrollscan.com",
    42220: "celoscan.io",
    default: "Unknown chainId",
  };
  return chainMap[chainId] || chainMap["default"];
}

function getCurrentUTCDateForSheets() {
  return new Date().toISOString().split("T")[0];
}

function transformData(item) {
  return [
    "Pending", // Status
    getCurrentUTCDateForSheets(), // Report Time
    item["Contract Address"].split(":")[2], // Address
    item["Project Name"].trim() + ": " + item["Public Name Tag"].trim(), // Name Tag
    item["UI/Website Link"], // URL
    null, // Label 1 (Optional)
    chainIdToExplorer(item["Contract Address"].split(":")[1]), // Chain
    item["Public Note"], // Public Note
    "Blue", // Public Comment Color
    "https://curate.kleros.io/tcr/100/itemID // Source",
  ];
}

function jsonToCSV(items) {
  if (!items.length) return "";
  const header = [
    "Status",
    "Report Time",
    "Address",
    "Name Tag",
    "URL",
    "Label 1",
    "Chain",
    "Public Note",
    "Public Comment Color",
    "Source",
  ];

  // A replacer function for JSON.stringify to handle null values
  const replacer = (key, value) => (value === null ? "" : value);

  // Use JSON.stringify to automatically handle escaping of characters that need it
  const csv = [
    header.join(","),
    ...items.map((item) =>
      transformData(item)
        .map((field) => JSON.stringify(field, replacer))
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
      const modulePath = join(SUBMODULES_DIR, submodule, "dist", "main.mjs");
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
      await writeFile(join(__dirname, "tags-etherscan.csv"), csv);
      console.log("Tags have been written to tags-etherscan.csv");
    }
  } catch (error) {
    console.error("Error in fetchAndProcessSubmodules:", error);
  }
}

fetchAndProcessSubmodules();
