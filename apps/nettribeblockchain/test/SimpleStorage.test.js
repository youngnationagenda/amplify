import hre from "hardhat";
import { expect } from "chai";

describe("SimpleStorage", function () {
  it("should store and retrieve a value", async function () {
    const connection = await hre.network.connect();
    const ethers = connection.ethers;

    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const storage = await SimpleStorage.deploy();
    await storage.waitForDeployment();

    await storage.store(42);
    expect(await storage.retrieve()).to.equal(42n);
  });
});
