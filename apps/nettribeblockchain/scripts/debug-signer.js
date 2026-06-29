import hre from "hardhat";
const conn = await hre.network.connect();
console.log("ethers:", typeof conn.ethers);
const [s] = await conn.ethers.getSigners();
console.log("Signer:", s.address);
