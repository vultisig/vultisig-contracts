import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VoltixWhitelisted", function () {
  async function deployVoltixWhitelistedFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const VoltixWhitelisted = await ethers.getContractFactory("VoltixWhitelisted");
    const voltix = await VoltixWhitelisted.deploy([]);

    const MockWhitelistSuccess = await ethers.getContractFactory("MockWhitelistSuccess");
    const MockWhitelistFail = await ethers.getContractFactory("MockWhitelistFail");

    const mockWhitelistSuccess = await MockWhitelistSuccess.deploy();
    const mockWhitelistFail = await MockWhitelistFail.deploy();

    return { voltix, owner, otherAccount, mockWhitelistSuccess, mockWhitelistFail };
  }

  describe("Ownable", function () {
    it("Should set the right whitelist contract", async function () {
      const { voltix, mockWhitelistSuccess } = await loadFixture(deployVoltixWhitelistedFixture);

      await voltix.setWhitelistContract(mockWhitelistSuccess);

      expect(await voltix.whitelistContract()).to.equal(mockWhitelistSuccess);
    });

    it("Should revert if called from non-owner contract", async function () {
      const { voltix, otherAccount, mockWhitelistSuccess } = await loadFixture(
        deployVoltixWhitelistedFixture,
      );

      await expect(
        voltix.connect(otherAccount).setWhitelistContract(mockWhitelistSuccess),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfer", function () {
    it("Should transfer when whitelist contract is not set", async function () {
      const amount = ethers.parseEther("1000");
      const { voltix, owner, otherAccount } = await loadFixture(deployVoltixWhitelistedFixture);
      expect(await voltix.transfer(otherAccount.address, amount)).to.changeTokenBalances(
        voltix,
        [owner.address, otherAccount.address],
        [-amount, amount],
      );
    });

    it("Should transfer when checkWhitelist succeeds", async function () {
      const amount = ethers.parseEther("1000");
      const { voltix, owner, otherAccount, mockWhitelistSuccess } = await loadFixture(
        deployVoltixWhitelistedFixture,
      );
      await voltix.setWhitelistContract(mockWhitelistSuccess);
      expect(await voltix.transfer(otherAccount.address, amount)).to.changeTokenBalances(
        voltix,
        [owner.address, otherAccount.address],
        [-amount, amount],
      );
    });

    it("Should revert transfer when checkWhitelist reverts", async function () {
      const amount = ethers.parseEther("1000");
      const { voltix, otherAccount, mockWhitelistFail } = await loadFixture(
        deployVoltixWhitelistedFixture,
      );

      await voltix.setWhitelistContract(mockWhitelistFail);
      await expect(voltix.transfer(otherAccount.address, amount)).to.be.reverted;
    });
  });
});
