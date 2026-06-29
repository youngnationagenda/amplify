import hre from "hardhat";
import fs from "fs";

// Hardhat default private keys (deterministic from mnemonic: "test test ... junk")
const HARDHAT_PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0049497f965d8d4262ba5b0a5fbe946add691784ea8ecbc",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250132c1ccc7640614afa6cb89b3c23f54e6498",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
  "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897",
  "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82",
  "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
  "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd",
  "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa",
  "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61",
  "0xea6c44ac03bff858b476bba28179e45a0014c98f30d0c8facd3a6fdea66f141c",
  "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd",
  "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0",
  "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e",
];

async function main() {
  const connection = await hre.network.connect();
  const accounts = await connection.ethers.getSigners();

  // Read existing .env
  const envPath = ".env";
  let existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  // Remove any previous ACCOUNT_ lines
  existing = existing.replace(/^ACCOUNT_\d+_(ADDRESS|PRIVATE_KEY)=.*\n?/gm, "").trimEnd();

  // Build new account lines
  const lines = accounts.map((account, i) => {
    const pk = HARDHAT_PRIVATE_KEYS[i] ?? "";
    return `ACCOUNT_${i}_ADDRESS=${account.address}\nACCOUNT_${i}_PRIVATE_KEY=${pk}`;
  });

  const updated = `${existing}\n\n# Hardhat default accounts\n${lines.join("\n")}\n`;
  fs.writeFileSync(envPath, updated);

  console.log(`Saved ${accounts.length} accounts to .env`);
  accounts.forEach((a, i) => console.log(`  [${i}] ${a.address}`));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
