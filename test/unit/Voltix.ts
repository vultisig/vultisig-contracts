import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Voltix", function () {
  async function deployVoltixFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Voltix = await ethers.getContractFactory("Voltix");
    const voltix = await Voltix.deploy([]);

    return { voltix, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right symbol and name", async function () {
      const { voltix } = await loadFixture(deployVoltixFixture);

      expect(await voltix.name()).to.equal("Voltix Token");
      expect(await voltix.symbol()).to.equal("VLTX");
    });

    it("Should set the right owner", async function () {
      const { voltix, owner } = await loadFixture(deployVoltixFixture);

      expect(await voltix.owner()).to.equal(owner.address);
    });

    it("Should mint 100M tokens to the owner", async function () {
      const { voltix, owner } = await loadFixture(deployVoltixFixture);
      const totalSupply = 100_000_000n * ethers.parseEther("1");

      expect(await voltix.balanceOf(owner.address)).to.equal(totalSupply);
      expect(await voltix.totalSupply()).to.equal(totalSupply);
    });
  });
});
