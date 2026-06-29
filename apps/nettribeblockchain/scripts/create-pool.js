import hre from "hardhat";
import {
  encodeSqrtPriceX96,
  getArgOrEnv,
  getConnectedEthers,
  loadArtifact,
  parseAddress,
  parseArgs,
  parseBigInt,
  requireValue,
  sortTokenPair
} from "./utils/uniswap.js";

async function main() {
  const args = parseArgs();

  const nfpmAddress = parseAddress(
    hre,
    requireValue(
      getArgOrEnv(args, "nfpm", "UNISWAP_NFPM_ADDRESS"),
      "Set UNISWAP_NFPM_ADDRESS or pass --nfpm"
    ),
    "nfpm"
  );

  const tokenA = parseAddress(
    hre,
    requireValue(
      getArgOrEnv(args, "token-a", "TOKEN_A_ADDRESS"),
      "Set TOKEN_A_ADDRESS or pass --token-a"
    ),
    "token A"
  );

  const tokenB = parseAddress(
    hre,
    requireValue(
      getArgOrEnv(args, "token-b", "TOKEN_B_ADDRESS"),
      "Set TOKEN_B_ADDRESS or pass --token-b"
    ),
    "token B"
  );

  const fee = Number(
    requireValue(getArgOrEnv(args, "fee", "POOL_FEE"), "Set POOL_FEE or pass --fee")
  );

  const [token0, token1] = sortTokenPair(hre, tokenA, tokenB);

  let sqrtPriceX96;

  const explicitSqrtPrice = getArgOrEnv(args, "sqrt-price-x96", "SQRT_PRICE_X96");

  if (explicitSqrtPrice) {
    sqrtPriceX96 = parseBigInt(explicitSqrtPrice, "sqrtPriceX96");
  } else {
    const priceToken1PerToken0 = requireValue(
      getArgOrEnv(args, "price", "PRICE_TOKEN1_PER_TOKEN0"),
      "Set PRICE_TOKEN1_PER_TOKEN0 or SQRT_PRICE_X96"
    );

    const token0Decimals = Number(
      requireValue(getArgOrEnv(args, "token0-decimals", "TOKEN0_DECIMALS"))
    );

    const token1Decimals = Number(
      requireValue(getArgOrEnv(args, "token1-decimals", "TOKEN1_DECIMALS"))
    );

    sqrtPriceX96 = encodeSqrtPriceX96({
      priceToken1PerToken0,
      token0Decimals,
      token1Decimals
    });
  }

  const artifact = loadArtifact(
    "periphery",
    "NonfungiblePositionManager.sol/NonfungiblePositionManager.json"
  );

  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();

  const nfpm = new ethers.Contract(nfpmAddress, artifact.abi, signer);

  const tx = await nfpm.createAndInitializePoolIfNecessary(
    token0,
    token1,
    fee,
    sqrtPriceX96
  );

  const receipt = await tx.wait();

  console.log("✅ Pool created");
  console.log("Network:", hre.network.name);
  console.log("Signer:", signer.address);
  console.log("NFPM:", nfpmAddress);
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Fee:", fee);
  console.log("TxHash:", receipt.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});