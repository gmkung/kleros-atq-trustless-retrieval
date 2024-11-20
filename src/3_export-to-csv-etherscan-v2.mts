import { promises as fs } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMODULES_DIR = join(__dirname, "../../submodules");
const DATA_FILE = join(__dirname, "../../data.json");
const EXPORTS_DIR = join(__dirname, "../exports");
const LOGS_DIR = join(__dirname, "../logs");

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

interface FailedSubmodule {
  chainId: number;
  commit: string;
  dir: string;
  error: string;
}

function chainIdToExplorer(chainId: number): string {
  const chainMap: { [key: number]: string } = {
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
  };
  return chainMap[chainId] || "Unknown ChainID";
}

function getCurrentUTCDateForSheets(): string {
  return new Date().toISOString().split("T")[0];
}

function transformData(item: Tag, url: string, commit: string): string[] {
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
    url.replace(/\.git$/, "") + "/commit/" + commit, // Source
  ];
}

function jsonToCSV(items: Tag[], url: string, commit: string): string {
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
      transformData(item, url, commit)
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

    await fs.mkdir(EXPORTS_DIR, { recursive: true });
    await fs.mkdir(LOGS_DIR, { recursive: true });

    const failedSubmodules: FailedSubmodule[] = [];

    for (const { url, commit, chainId } of data) {
      try {
        new URL(url);
      } catch (e) {
        console.log(`Invalid URL format: ${url} - skipping...`);
        failedSubmodules.push({
          chainId,
          commit,
          dir: url,
          error: `Invalid URL format: ${
            e instanceof Error ? e.message : String(e)
          }`,
        });
        continue;
      }

      const DIR_NAME = `${basename(url, ".git")}-${commit}`;
      const modulePath = join(SUBMODULES_DIR, DIR_NAME, "dist", "main.mjs");

      try {
        const submoduleImport = await import(modulePath);
        const tags = await submoduleImport.returnTags(
          chainId.toString(),
          process.env.THEGRAPH_API_KEY
        );
        console.log("Tags: ", tags);
        if (Array.isArray(tags) && tags.length > 0) {
          const csv = jsonToCSV(tags, url, commit);
          console.log(__dirname);
          const fileName = `tags-export(${commit}-${chainId}).csv`;
          await fs.writeFile(join(EXPORTS_DIR, fileName), csv);

          console.log(`Tags have been written to ${fileName}`);
        }
      } catch (error) {
        console.error(`Error in processing submodule ${DIR_NAME}:`);
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Stack trace:", error.stack);
        }
        if (typeof error === "object" && error !== null) {
          console.error(
            "Full error object:",
            JSON.stringify(error, Object.getOwnPropertyNames(error))
          );
        }
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          console.error("Error response:", JSON.stringify(error.response));
        }
        failedSubmodules.push({
          chainId,
          commit,
          dir: DIR_NAME,
          error:
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : `Unknown error: ${JSON.stringify(error)}`,
        });
      }
    }

    const date = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_');
    const logFile = join(LOGS_DIR, `submodules-report-${date}.json`);
    await fs.writeFile(
      logFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalProcessed: data.length,
          failedCount: failedSubmodules.length,
          failures: failedSubmodules,
        },
        null,
        2
      )
    );
    console.log(`Processing report has been logged to ${logFile}`);
  } catch (error) {
    console.error("Error in fetchAndProcessSubmodules:", error);
  }
}

fetchAndProcessSubmodules();
