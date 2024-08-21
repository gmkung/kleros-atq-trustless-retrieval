import { promises as fs } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMODULES_DIR = join(__dirname, "../../submodules");
const DATA_FILE = join(__dirname, "../../data.json");
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
    };
    return chainMap[chainId] || "Unknown ChainID";
}
function getCurrentUTCDateForSheets() {
    return new Date().toISOString().split("T")[0];
}
function transformData(item, url, commit) {
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
function jsonToCSV(items, url, commit) {
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
    const replacer = (key, value) => (value === null ? "" : value);
    const csv = [
        header.join(","),
        ...items.map((item) => transformData(item, url, commit)
            .map((field) => JSON.stringify(field, replacer))
            .join(",")),
    ].join("\r\n");
    return csv;
}
async function fetchAndProcessSubmodules() {
    try {
        const data = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
        for (const { url, commit, chainId } of data) {
            const DIR_NAME = `${basename(url, ".git")}-${commit}`;
            const modulePath = join(SUBMODULES_DIR, DIR_NAME, "dist", "main.mjs");
            try {
                const submoduleImport = await import(modulePath);
                const tags = await submoduleImport.returnTags(chainId.toString(), process.env.THEGRAPH_API_KEY);
                if (Array.isArray(tags) && tags.length > 0) {
                    const csv = jsonToCSV(tags, url, commit);
                    console.log(__dirname);
                    const fileName = `tags-export(${commit}-${chainId}).csv`;
                    await fs.writeFile(join(__dirname + "../../exports", fileName), csv);
                    console.log(`Tags have been written to ${fileName}`);
                }
            }
            catch (error) {
                console.error(`Error in processing submodule ${DIR_NAME}:`, error);
            }
        }
    }
    catch (error) {
        console.error("Error in fetchAndProcessSubmodules:", error);
    }
}
fetchAndProcessSubmodules();
