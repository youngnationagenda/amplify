import hre from "hardhat";
import { getConnectedEthers } from "./utils/uniswap.js";

async function main() {
  const ethers = await getConnectedEthers(hre);
  const Factory = await ethers.getContractFactory("UniswapV3Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  console.log("UniswapV3Factory deployed at:", await factory.getAddress());
}

main().catch(console.error);
