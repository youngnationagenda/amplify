import hre from "hardhat";
import { getConnectedEthers, loadArtifact, getArgOrEnv, parseArgs } from "./utils/uniswap.js";

async function main() {
  const args = parseArgs();
  const tokenId = BigInt(getArgOrEnv(args, "token-id", "TOKEN_ID") ?? (() => { throw new Error("Set TOKEN_ID or --token-id"); })());
  const liquidityPct = Number(getArgOrEnv(args, "liquidity-pct", "LIQUIDITY_PCT", "100"));
  const deadlineSeconds = Number(getArgOrEnv(args, "deadline-seconds", "DEADLINE_SECONDS", "1800"));

  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();

  const artifact = loadArtifact("periphery", "NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
  const nfpm = new ethers.Contract(process.env.UNISWAP_NFPM_ADDRESS, artifact.abi, signer);

  const position = await nfpm.positions(tokenId);
  const liquidity = (position.liquidity * BigInt(liquidityPct)) / 100n;

  console.log(`Token ID: ${tokenId}, removing ${liquidityPct}% liquidity (${liquidity})`);

  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

  const decreaseTx = await nfpm.decreaseLiquidity({
    tokenId, liquidity, amount0Min: 0, amount1Min: 0, deadline,
  }, { gasLimit: 300000 });
  await decreaseTx.wait();
  console.log("✅ Liquidity decreased");

  const collectTx = await nfpm.collect({
    tokenId,
    recipient: signer.address,
    amount0Max: BigInt("340282366920938463463374607431768211455"),
    amount1Max: BigInt("340282366920938463463374607431768211455"),
  }, { gasLimit: 200000 });
  const receipt = await collectTx.wait();
  console.log("✅ Tokens collected — TxHash:", receipt.hash);
}

main().catch((e) => { console.error(e.shortMessage ?? e); process.exit(1); });
