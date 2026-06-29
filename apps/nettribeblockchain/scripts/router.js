import hre from "hardhat";
import { loadArtifact, getConnectedEthers, ERC20_ABI } from "./utils/uniswap.js";

const ROUTER   = process.env.UNISWAP_SWAP_ROUTER;
const TOKEN_IN  = process.env.TOKEN_A_ADDRESS;  // NTC
const TOKEN_OUT = process.env.TOKEN_B_ADDRESS;  // USDC
const FEE       = Number(process.env.POOL_FEE) || 3000;
const AMOUNT_IN = BigInt(process.env.AMOUNT_IN || "1000000000000000000"); // 1 NTC
const AMOUNT_OUT_MIN = 0n;

async function main() {
  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();

  // Approve router to spend TOKEN_IN
  const tokenIn = new ethers.Contract(TOKEN_IN, ERC20_ABI, signer);
  const allowance = await tokenIn.allowance(signer.address, ROUTER);
  if (allowance < AMOUNT_IN) {
    console.log("Approving router to spend NTC...");
    await (await tokenIn.approve(ROUTER, AMOUNT_IN * 2n)).wait();
  }

  const artifact = loadArtifact("periphery", "SwapRouter.sol/SwapRouter.json");
  const router = new ethers.Contract(ROUTER, artifact.abi, signer);

  const deadline = Math.floor(Date.now() / 1000) + 1800;

  console.log("SwapRouter:", ROUTER);
  console.log("Swapping", AMOUNT_IN.toString(), "NTC → USDC");

  const tx = await router.exactInputSingle({
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    fee: FEE,
    recipient: signer.address,
    deadline,
    amountIn: AMOUNT_IN,
    amountOutMinimum: AMOUNT_OUT_MIN,
    sqrtPriceLimitX96: 0,
  }, { gasLimit: 300000 });

  const receipt = await tx.wait();
  console.log("✅ Swap executed");
  console.log("TxHash:", receipt.hash);

  // Show new USDC balance
  const tokenOut = new ethers.Contract(TOKEN_OUT, ERC20_ABI, signer);
  const bal = await tokenOut.balanceOf(signer.address);
  console.log("USDC balance after swap:", (Number(bal) / 1e6).toFixed(6), "USDC");
}

main().catch((e) => { console.error(e.shortMessage ?? e); process.exit(1); });
