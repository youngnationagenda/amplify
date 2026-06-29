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
  const [deployer] = await ethers.getSigners();

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const nftDescriptorArtifact = loadArtifact(
    "periphery",
    "libraries/NFTDescriptor.sol/NFTDescriptor.json"
  );
  const nftDescriptorLibrary = await deployArtifact(hre, nftDescriptorArtifact);

  console.log(`NFTDescriptor: ${await nftDescriptorLibrary.getAddress()}`);

  const descriptorArtifact = loadArtifact(
    "periphery",
    "NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"
  );
  const descriptor = await deployArtifact(
    hre,
    descriptorArtifact,
    [wrappedNative, encodeBytes32String(hre, nativeLabel)],
    { NFTDescriptor: await nftDescriptorLibrary.getAddress() }
  );

  console.log(`PositionDescriptor: ${await descriptor.getAddress()}`);

  const nfpmArtifact = loadArtifact(
    "periphery",
    "NonfungiblePositionManager.sol/NonfungiblePositionManager.json"
  );
  const nfpm = await deployArtifact(hre, nfpmArtifact, [
    factory,
    wrappedNative,
    await descriptor.getAddress()
  ]);

  console.log(`NonfungiblePositionManager: ${await nfpm.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
