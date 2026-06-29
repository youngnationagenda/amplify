import { ethers } from "ethers";
import { createRequire } from "module";
import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config({ override: true, quiet: true });

const require = createRequire(import.meta.url);
const provider = new ethers.JsonRpcProvider(process.env.CELO_RPC_URL);

const addresses = JSON.parse(readFileSync("deployed-addresses.json", "utf8"));

const checks = [
  { name: "Factory",           addr: addresses.factory,           abi: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json").abi, call: async (c) => { await c.feeAmountTickSpacing(3000); return "fee 3000 enabled"; } },
  { name: "NFPM",              addr: addresses.nfpm,              abi: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json").abi, call: async (c) => { const f = await c.factory(); return `factory=${f.slice(0,10)}...`; } },
  { name: "SwapRouter",        addr: addresses.swapRouter,        abi: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json").abi, call: async (c) => { const f = await c.factory(); return `factory=${f.slice(0,10)}...`; } },
  { name: "QuoterV2",          addr: addresses.quoterV2,          abi: require("@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json").abi, call: async (c) => { const f = await c.factory(); return `factory=${f.slice(0,10)}...`; } },
];

let passed = 0, failed = 0;

for (const { name, addr, abi, call } of checks) {
  try {
    const code = await provider.getCode(addr);
    if (code === "0x") throw new Error("no bytecode");
    const contract = new ethers.Contract(addr, abi, provider);
    const result = await call(contract);
    console.log(`✅ ${name.padEnd(16)} ${addr}  (${result})`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name.padEnd(16)} ${addr}  — ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
