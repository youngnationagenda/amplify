import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import dotenv from "dotenv";
dotenv.config({ override: true, quiet: true });

export default {
  plugins: [hardhatEthers, hardhatMocha],
  solidity: {
    compilers: [
      { version: "0.7.6" },
      { version: "0.8.20" },
    ],
  },
  networks: {
    celoSepolia: {
      type: "http",
      url: process.env.CELO_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
