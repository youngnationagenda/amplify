import { ethers } from "ethers";
import { createRequire } from "module";
import { config } from "dotenv";
config();

const require = createRequire(import.meta.url);

const artifact = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const provider = new ethers.JsonRpcProvider(process.env.CELO_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log("Deployer:", wallet.address);

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();

console.log("UniswapV3Factory:", address);
