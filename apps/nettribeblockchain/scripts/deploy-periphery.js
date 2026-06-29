import hre from "hardhat";
import {
  deployArtifact,
  encodeBytes32String,
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
  const nativeLabel = getArgOrEnv(args, "native-label", "NATIVE_CURRENCY_LABEL", "CELO");

  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();

  console.log(`Deployer: ${signer.address}`);
  console.log(`Factory: ${factory}`);
  console.log(`Wrapped native token: ${wrappedNative}`);

  // --- Deploy NFTDescriptor ---
  const nftDescriptorArtifact = loadArtifact(
    "periphery",
    "libraries/NFTDescriptor.sol/NFTDescriptor.json"
  );
  const nftDescriptorLibrary = await deployArtifact(hre, nftDescriptorArtifact);
  const nftDescriptorAddress = await nftDescriptorLibrary.getAddress();
  console.log(`NFTDescriptor: ${nftDescriptorAddress}`);

  // --- Deploy PositionDescriptor ---
  const descriptorArtifact = loadArtifact(
    "periphery",
    "NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"
  );
  const descriptor = await deployArtifact(
    hre,
    descriptorArtifact,
    [wrappedNative, encodeBytes32String(hre, nativeLabel)],
    { NFTDescriptor: nftDescriptorAddress }
  );
  const descriptorAddress = await descriptor.getAddress();
  console.log(`PositionDescriptor: ${descriptorAddress}`);

  // --- Deploy NFPM ---
  const nfpmArtifact = loadArtifact(
    "periphery",
    "NonfungiblePositionManager.sol/NonfungiblePositionManager.json"
  );
  const nfpm = await deployArtifact(hre, nfpmArtifact, [
    factory,
    wrappedNative,
    descriptorAddress
  ]);
  const nfpmAddress = await nfpm.getAddress();
  console.log(`NonfungiblePositionManager: ${nfpmAddress}`);

  // --- Deploy SwapRouter ---
  const swapRouterArtifact = loadArtifact("periphery", "SwapRouter.sol/SwapRouter.json");
  const swapRouter = await deployArtifact(hre, swapRouterArtifact, [factory, wrappedNative]);
  const swapRouterAddress = await swapRouter.getAddress();
  console.log(`SwapRouter: ${swapRouterAddress}`);

  // --- Deploy QuoterV2 ---
  const quoterV2Artifact = loadArtifact(
    "periphery",
    "lens/QuoterV2.sol/QuoterV2.json"
  );
  const quoterV2 = await deployArtifact(hre, quoterV2Artifact, [factory, wrappedNative]);
  const quoterV2Address = await quoterV2.getAddress();
  console.log(`QuoterV2: ${quoterV2Address}`);

  // Persist addresses in a config file
  const config = {
    factory,
    wrappedNative,
    nftDescriptor: nftDescriptorAddress,
    positionDescriptor: descriptorAddress,
    nfpm: nfpmAddress,
    swapRouter: swapRouterAddress,
    quoterV2: quoterV2Address
  };

  const fs = await import("fs");
  fs.writeFileSync("deployed-addresses.json", JSON.stringify(config, null, 2));
  console.log("✅ Addresses persisted to deployed-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
