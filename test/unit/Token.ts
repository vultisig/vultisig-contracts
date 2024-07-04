import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token", function () {
  async function deployTokenFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();

    return { token, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right symbol and name", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.eq("");
      expect(await token.symbol()).to.eq("");
    });

    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      expect(await token.owner()).to.eq(owner.address);
    });

    it("Should mint 100M tokens to the owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const totalSupply = 100_000_000n * ethers.parseEther("1");

      expect(await token.balanceOf(owner.address)).to.eq(totalSupply);
      expect(await token.totalSupply()).to.eq(totalSupply);
    });
  });

  describe("Ownable", function () {
    it("Should set the updated name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await token.setNameAndTicker("Token", "TK");

      expect(await token.name()).to.eq("Token");
      expect(await token.symbol()).to.eq("TK");
    });
  });
});
