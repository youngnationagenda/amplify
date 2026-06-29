import hre from "hardhat";
import { getConnectedEthers } from "./utils/uniswap.js";

async function main() {
  const ethers = await getConnectedEthers(hre);
  const [sender] = await ethers.getSigners();
  const recipientAddress = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

  console.log(`Sending ETH from: ${sender.address}`);
  console.log(`Sending ETH to: ${recipientAddress}`);

  const amountInEther = "100.0";
  const amountInWei = ethers.parseEther(amountInEther);

  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amountInWei,
  });

  console.log(`Transaction submitted! Hash: ${tx.hash}`);
  await tx.wait();
  console.log(`Successfully transferred ${amountInEther} ETH!`);

  const recipientBalance = await ethers.provider.getBalance(recipientAddress);
  console.log(`Recipient new balance: ${ethers.formatEther(recipientBalance)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
