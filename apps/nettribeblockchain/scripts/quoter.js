import hre from "hardhat";
import { loadArtifact, getConnectedEthers } from "./utils/uniswap.js";

const QUOTER_V2  = process.env.UNISWAP_QUOTER_V2;
const TOKEN_IN   = process.env.TOKEN_A_ADDRESS;  // NTC
const TOKEN_OUT  = process.env.TOKEN_B_ADDRESS;  // USDC
const FEE        = Number(process.env.POOL_FEE) || 3000;
const AMOUNT_IN  = BigInt(process.env.AMOUNT_IN || "1000000000000000000"); // 1 NTC

async function main() {
  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();

  const artifact = loadArtifact("periphery", "lens/QuoterV2.sol/QuoterV2.json");
  const quoter = new ethers.Contract(QUOTER_V2, artifact.abi, signer);

  console.log("QuoterV2:", QUOTER_V2);
  console.log("tokenIn (NTC):", TOKEN_IN);
  console.log("tokenOut (USDC):", TOKEN_OUT);
  console.log("amountIn:", AMOUNT_IN.toString(), "(1 NTC)");

  const [amountOut] = await quoter.quoteExactInputSingle.staticCall({
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    fee: FEE,
    amountIn: AMOUNT_IN,
    sqrtPriceLimitX96: 0,
  });

  console.log("✅ Expected amountOut (USDC):", amountOut.toString(), `(${Number(amountOut) / 1e6} USDC)`);
}

main().catch((e) => { console.error(e.shortMessage ?? e); process.exit(1); });
