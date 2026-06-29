import hre from "hardhat";
import {
  deployArtifact,
  getArgOrEnv,
  getConnectedEthers,
  loadArtifact,
  parseAddress,
  parseArgs,
  requireValue
} from "./utils/uniswap.js";

async function main() {
  const args = parseArgs();

  const factory = parseAddress(
    hre,
    requireValue(
      getArgOrEnv(args, "factory", "UNISWAP_V3_FACTORY"),
      "Set UNISWAP_V3_FACTORY or pass --factory"
    ),
    "factory"
  );
  const wrappedNative = parseAddress(
    hre,
    requireValue(
      getArgOrEnv(args, "wrapped-native", "WRAPPED_NATIVE_TOKEN"),
      "Set WRAPPED_NATIVE_TOKEN or pass --wrapped-native"
    ),
    "wrapped native token"
  );
  const positionDescriptor = parseAddress(
    hre,
    requireValue(
      getArgOrEnv(args, "position-descriptor", "UNISWAP_POSITION_DESCRIPTOR"),
      "Set UNISWAP_POSITION_DESCRIPTOR or pass --position-descriptor"
    ),
    "position descriptor"
  );

  const ethers = await getConnectedEthers(hre);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // --- Deploy NFPM ---
  console.log("🚀 Deploying NonfungiblePositionManager...");
  const nfpmArtifact = loadArtifact(
    "periphery",
    "NonfungiblePositionManager.sol/NonfungiblePositionManager.json"
  );
  const nfpm = await deployArtifact(hre, nfpmArtifact, [factory, wrappedNative, positionDescriptor]);
  console.log(`✅ NFPM deployed at: ${await nfpm.getAddress()}`);

  // --- Deploy QuoterV2 ---
  console.log("🚀 Deploying QuoterV2...");
  const quoterArtifact = loadArtifact("periphery", "lens/QuoterV2.sol/QuoterV2.json");
  const quoter = await deployArtifact(hre, quoterArtifact, [factory, wrappedNative]);
  console.log(`✅ QuoterV2 deployed at: ${await quoter.getAddress()}`);

  // --- Deploy SwapRouter ---
  console.log("🚀 Deploying SwapRouter...");
  const routerArtifact = loadArtifact("periphery", "SwapRouter.sol/SwapRouter.json");
  const router = await deployArtifact(hre, routerArtifact, [factory, wrappedNative]);
  console.log(`✅ SwapRouter deployed at: ${await router.getAddress()}`);

  console.log("🎉 All contracts deployed successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
