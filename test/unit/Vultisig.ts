import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vultisig", function () {
  async function deployVultisigFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Vultisig = await ethers.getContractFactory("Vultisig");
    const vultisig = await Vultisig.deploy([]);

    return { vultisig, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right symbol and name", async function () {
      const { vultisig } = await loadFixture(deployVultisigFixture);

      expect(await vultisig.name()).to.equal("Vultisig Token");
      expect(await vultisig.symbol()).to.equal("VLTI");
    });

    it("Should set the right owner", async function () {
      const { vultisig, owner } = await loadFixture(deployVultisigFixture);

      expect(await vultisig.owner()).to.equal(owner.address);
    });

    it("Should mint 100M tokens to the owner", async function () {
      const { vultisig, owner } = await loadFixture(deployVultisigFixture);
      const totalSupply = 100_000_000n * ethers.parseEther("1");

      expect(await vultisig.balanceOf(owner.address)).to.equal(totalSupply);
      expect(await vultisig.totalSupply()).to.equal(totalSupply);
    });
  });
});
