import { promises as fs } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMODULES_DIR = join(__dirname, "../../submodules");
const DATA_FILE = join(__dirname, "../../data.json");

interface SubmoduleData {
  url: string;
  commit: string;
  chainId: number;
}

interface Tag {
  "Contract Address": string;
  "Project Name": string;
  "Public Name Tag": string;
  "UI/Website Link": string;
  "Public Note": string;
}

function chainIdToExplorer(chainId: number): string {
  const chainMap: { [key: number]: string } = {
    1: "Etherscan",
    10: "Optimistic.etherscan.io",
    56: "Bscscan",
    100: "Gnosisscan",
    137: "Polygonscan",
    8453: "Basescan.org",
    42161: "Arbiscan.io",
    1284: "Moonscan.io",
    59144: "Lineascan.build",
    250: "Ftmscan.com",
    324: "era.zksync.network",
    1285: "Moonriver.moonscan.io",
    43114: "Snowtrace.io",
    25: "Cronoscan.com",
    199: "Bttcscan.com",
    1101: "Zkevm.polygonscan.com",
    1111: "Wemixscan.com",
    534352: "Scrollscan.dev",
    42220: "Celoscan.io",
  };
  return chainMap[chainId] || "Unknown ChainID";
}

function getCurrentUTCDateForSheets(): string {
  return new Date().toISOString().split("T")[0];
}

function transformData(item: Tag): string[] {
  return [
    "Pending", // Status
    getCurrentUTCDateForSheets(), // Report Time
    item["Contract Address"].split(":")[2], // Address
    item["Project Name"].trim() + ": " + item["Public Name Tag"].trim(), // Name Tag
    item["UI/Website Link"], // URL
    "", // Label 1 (Optional)
    chainIdToExplorer(parseInt(item["Contract Address"].split(":")[1])), // Chain
    item["Public Note"], // Public Note
    "Blue", // Public Comment Color
    "https://curate.kleros.io/tcr/100/itemID", // Source
  ];
}

function jsonToCSV(items: Tag[]): string {
  const header: string[] = [
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

  const replacer = (key: string, value: any) => (value === null ? "" : value);
  const csv: string = [
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
    const data: SubmoduleData[] = JSON.parse(
      await fs.readFile(DATA_FILE, "utf-8")
    );

    for (const { url, commit, chainId } of data) {
      const DIR_NAME = `${basename(url, ".git")}-${commit}`;
      const modulePath = join(SUBMODULES_DIR, DIR_NAME, "dist", "main.mjs");

      try {
        const submoduleImport = await import(modulePath);
        const tags = await submoduleImport.returnTags(
          chainId.toString(),
          process.env.THEGRAPH_API_KEY
        );
        if (Array.isArray(tags) && tags.length > 0) {
          const csv = jsonToCSV(tags);
          console.log(__dirname);
          const fileName = `tags-export(${commit}-${chainId}).csv`;
          await fs.writeFile(join(__dirname + "../../exports", fileName), csv);

          console.log(`Tags have been written to ${fileName}`);
        }
      } catch (error) {
        console.error(`Error in processing submodule ${DIR_NAME}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in fetchAndProcessSubmodules:", error);
  }
}

fetchAndProcessSubmodules();
