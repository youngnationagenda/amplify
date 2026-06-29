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
  const ethers = await getConnectedEthers(hre);
  const [deployer] = await ethers.getSigners();
  const artifact = loadArtifact("periphery", "SwapRouter.sol/SwapRouter.json");
  const router = await deployArtifact(hre, artifact, [factory, wrappedNative]);

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`SwapRouter: ${await router.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
