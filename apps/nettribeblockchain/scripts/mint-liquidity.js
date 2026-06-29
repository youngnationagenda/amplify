import hre from "hardhat";
import {
  getArgOrEnv,
  getConnectedEthers,
  loadArtifact,
  parseAddress,
  parseArgs,
  parseBigInt,
  requireValue,
  sortTokenPair
} from "./utils/uniswap.js";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

async function ensureAllowance(token, owner, spender, amount) {
  const allowance = await token.allowance(owner, spender);

  if (allowance >= amount) return;

  const tx = await token.approve(spender, amount);
  await tx.wait();
}

async function main() {
  const args = parseArgs();

  const nfpmAddress = parseAddress(
    hre,
    requireValue(getArgOrEnv(args, "nfpm", "UNISWAP_NFPM_ADDRESS")),
    "nfpm"
  );

  const tokenA = parseAddress(
    hre,
    requireValue(getArgOrEnv(args, "token-a", "TOKEN_A_ADDRESS")),
    "token A"
  );

  const tokenB = parseAddress(
    hre,
    requireValue(getArgOrEnv(args, "token-b", "TOKEN_B_ADDRESS")),
    "token B"
  );

  const fee = Number(requireValue(getArgOrEnv(args, "fee", "POOL_FEE")));

  const tickLower = Number(requireValue(getArgOrEnv(args, "tick-lower", "TICK_LOWER")));
  const tickUpper = Number(requireValue(getArgOrEnv(args, "tick-upper", "TICK_UPPER")));

  const amountADesired = parseBigInt(requireValue(getArgOrEnv(args, "amount-a-desired", "AMOUNT_A_DESIRED")));
  const amountBDesired = parseBigInt(requireValue(getArgOrEnv(args, "amount-b-desired", "AMOUNT_B_DESIRED")));

  const amountAMin = parseBigInt(getArgOrEnv(args, "amount-a-min", "AMOUNT_A_MIN", "0"));
  const amountBMin = parseBigInt(getArgOrEnv(args, "amount-b-min", "AMOUNT_B_MIN", "0"));

  const deadlineSeconds = Number(getArgOrEnv(args, "deadline-seconds", "DEADLINE_SECONDS", "1800"));

  const [token0, token1] = sortTokenPair(hre, tokenA, tokenB);

  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();

  const recipient = signer.address;

  const amount0Desired = token0 === tokenA ? amountADesired : amountBDesired;
  const amount1Desired = token1 === tokenA ? amountADesired : amountBDesired;

  const amount0Min = token0 === tokenA ? amountAMin : amountBMin;
  const amount1Min = token1 === tokenA ? amountAMin : amountBMin;

  const token0Contract = new ethers.Contract(token0, ERC20_ABI, signer);
  const token1Contract = new ethers.Contract(token1, ERC20_ABI, signer);

  await ensureAllowance(token0Contract, signer.address, nfpmAddress, amount0Desired);
  await ensureAllowance(token1Contract, signer.address, nfpmAddress, amount1Desired);

  const nfpmArtifact = loadArtifact(
    "periphery",
    "NonfungiblePositionManager.sol/NonfungiblePositionManager.json"
  );

  const nfpm = new ethers.Contract(nfpmAddress, nfpmArtifact.abi, signer);

  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

  const tx = await nfpm.mint({
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    recipient,
    deadline
  }, { gasLimit: 500000 });

  const receipt = await tx.wait();

  console.log("✅ Liquidity minted");
  console.log("Network:", hre.network.name);
  console.log("Signer:", signer.address);
  console.log("NFPM:", nfpmAddress);
  console.log("TxHash:", receipt.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});