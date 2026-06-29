import { createRequire } from "node:module";
import { encodeBytes32String as ethersEncodeBytes32String, getAddress } from "ethers";

const require = createRequire(import.meta.url);

const ARTIFACT_ROOTS = {
  periphery: "@uniswap/v3-periphery/artifacts/contracts",
  core: "@uniswap/v3-core/artifacts/contracts"
};

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const next = argv[i + 1];
    const value = inlineValue ?? (next && !next.startsWith("--") ? next : "true");

    if (inlineValue === undefined && next && !next.startsWith("--")) {
      i += 1;
    }

    args[rawKey] = value;
  }

  return args;
}

export function getArgOrEnv(args, key, envName, fallback) {
  return args[key] ?? process.env[envName] ?? fallback;
}

export function requireValue(value, message) {
  if (value === undefined || value === null || value === "") {
    throw new Error(message);
  }

  return value;
}

export function loadArtifact(group, relativePath) {
  const root = ARTIFACT_ROOTS[group];

  if (!root) {
    throw new Error(`Unsupported artifact group: ${group}`);
  }

  return require(`${root}/${relativePath}`);
}

function normalizeAddress(address) {
  return address.toLowerCase().replace(/^0x/, "");
}

export function linkBytecode(artifact, libraries = {}) {
  if (!artifact.linkReferences || Object.keys(artifact.linkReferences).length === 0) {
    return artifact.bytecode;
  }

  let linkedBytecode = artifact.bytecode.slice(2);

  for (const [sourceName, references] of Object.entries(artifact.linkReferences)) {
    for (const [libraryName, fixups] of Object.entries(references)) {
      const address =
        libraries[`${sourceName}:${libraryName}`] ??
        libraries[libraryName];

      if (!address) {
        throw new Error(`Missing library address for ${sourceName}:${libraryName}`);
      }

      const normalizedAddress = normalizeAddress(address);

      for (const { start, length } of fixups) {
        const offset = start * 2;
        const size = length * 2;
        linkedBytecode =
          linkedBytecode.slice(0, offset) +
          normalizedAddress.padStart(size, "0") +
          linkedBytecode.slice(offset + size);
      }
    }
  }

  return `0x${linkedBytecode}`;
}

export async function deployArtifact(hre, artifact, constructorArgs = [], libraries = {}) {
  const ethers = await getConnectedEthers(hre);
  const [signer] = await ethers.getSigners();
  const bytecode = linkBytecode(artifact, libraries);
  const factory = new ethers.ContractFactory(artifact.abi, bytecode, signer);
  const contract = await factory.deploy(...constructorArgs);

  await contract.waitForDeployment();

  return contract;
}

export async function getConnectedEthers(hre) {
  const connection = await hre.network.connect();
  return connection.ethers;
}

export function parseBigInt(value, label) {
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid bigint for ${label}: ${value}`);
  }
}

export function parseAddress(_hre, value, label) {
  try {
    return getAddress(value);
  } catch {
    throw new Error(`Invalid address for ${label}: ${value}`);
  }
}

export function sortTokenPair(_hre, tokenA, tokenB) {
  const a = getAddress(tokenA);
  const b = getAddress(tokenB);

  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

export function encodeBytes32String(_hre, value) {
  return ethersEncodeBytes32String(value);
}

export function decimalToFraction(value) {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid decimal value: ${value}`);
  }

  if (!value.includes(".")) {
    return {
      numerator: BigInt(value),
      denominator: 1n
    };
  }

  const [whole, fraction] = value.split(".");
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(`${whole}${fraction}`);

  return { numerator, denominator };
}

export function sqrtBigInt(value) {
  if (value < 0n) {
    throw new Error("Cannot compute sqrt of a negative bigint");
  }

  if (value < 2n) {
    return value;
  }

  let x0 = value;
  let x1 = (value >> 1n) + 1n;

  while (x1 < x0) {
    x0 = x1;
    x1 = (x1 + value / x1) >> 1n;
  }

  return x0;
}

export function encodeSqrtPriceX96({
  priceToken1PerToken0,
  token0Decimals,
  token1Decimals
}) {
  const { numerator, denominator } = decimalToFraction(priceToken1PerToken0);
  const numeratorScaled =
    numerator * (10n ** BigInt(token0Decimals)) * (2n ** 192n);
  const denominatorScaled =
    denominator * (10n ** BigInt(token1Decimals));

  return sqrtBigInt(numeratorScaled / denominatorScaled);
}

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];
