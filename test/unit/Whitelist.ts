import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Whitelist", function () {
  async function deployWhitelistFixture() {
    const [owner, otherAccount, batchedAccount, mockContract] = await ethers.getSigners();

    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await Whitelist.deploy();

    const MockOracleSuccess = await ethers.getContractFactory("MockOracleSuccess");
    const MockOracleFail = await ethers.getContractFactory("MockOracleFail");

    const mockOracleSuccess = await MockOracleSuccess.deploy();
    const mockOracleFail = await MockOracleFail.deploy();

    return {
      whitelist,
      mockOracleSuccess,
      mockOracleFail,
      owner,
      otherAccount,
      batchedAccount,
      mockContract,
    };
  }

  describe("Deployment", function () {
    it("Should set max address cap, locked, isSelfWhitelistDisabled", async function () {
      const { whitelist } = await loadFixture(deployWhitelistFixture);

      expect(await whitelist.maxAddressCap()).to.eq(10_000 * 1e6);
      expect(await whitelist.locked()).to.eq(true);
    });
  });

  describe("Ownable", function () {
    // , max address cap, voltix, uniswap contract, isSelfWhitelistDisabled
    it("Should set locked", async function () {
      const { whitelist } = await loadFixture(deployWhitelistFixture);

      await whitelist.setLocked(false);
      expect(await whitelist.locked()).to.equal(false);
    });

    it("Should set max address cap", async function () {
      const { whitelist } = await loadFixture(deployWhitelistFixture);

      await whitelist.setMaxAddressCap(10_000_000 * 1e6);
      expect(await whitelist.maxAddressCap()).to.equal(10_000_000 * 1e6);
    });

    it("Should set oracle contract", async function () {
      const { whitelist, mockOracleSuccess } = await loadFixture(deployWhitelistFixture);

      await whitelist.setOracle(mockOracleSuccess);
      expect(await whitelist.oracle()).to.equal(mockOracleSuccess);
    });

    it("Should set voltix token", async function () {
      const { whitelist, mockContract } = await loadFixture(deployWhitelistFixture);

      await whitelist.setVoltix(mockContract.address);
      expect(await whitelist.voltix()).to.equal(mockContract.address);
    });

    it("Should set uniswap contract", async function () {
      const { whitelist, mockContract } = await loadFixture(deployWhitelistFixture);

      await whitelist.setUniswapContract(mockContract.address);
      expect(await whitelist.uniswapContract()).to.equal(mockContract.address);
    });

    it("Should set self whitelist disabled", async function () {
      const { whitelist } = await loadFixture(deployWhitelistFixture);

      await whitelist.setIsSelfWhitelistDisabled(true);
      expect(await whitelist.isSelfWhitelistDisabled()).to.equal(true);
    });

    it("Should add whitelisted address", async function () {
      const { whitelist, otherAccount } = await loadFixture(deployWhitelistFixture);

      expect(await whitelist.isWhitelisted(otherAccount)).to.equal(false);
      await whitelist.addWhitelistedAddress(otherAccount);
      expect(await whitelist.isWhitelisted(otherAccount)).to.equal(true);
    });

    it("Should add batch whitelisted address", async function () {
      const { whitelist, otherAccount, batchedAccount } = await loadFixture(deployWhitelistFixture);

      expect(await whitelist.isWhitelisted(otherAccount)).to.equal(false);
      expect(await whitelist.isWhitelisted(batchedAccount)).to.equal(false);
      await whitelist.addBatchWhitelist([otherAccount, batchedAccount]);
      expect(await whitelist.isWhitelisted(otherAccount)).to.equal(true);
      expect(await whitelist.isWhitelisted(batchedAccount)).to.equal(true);
    });

    it("Should revert if called from non-owner address", async function () {
      const { whitelist, otherAccount, batchedAccount, mockContract } =
        await loadFixture(deployWhitelistFixture);

      await expect(whitelist.connect(otherAccount).setLocked(true)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      await expect(whitelist.connect(otherAccount).setMaxAddressCap(10_000)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      await expect(whitelist.connect(otherAccount).setOracle(mockContract)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      await expect(whitelist.connect(otherAccount).setVoltix(mockContract)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      await expect(
        whitelist.connect(otherAccount).setUniswapContract(mockContract),
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        whitelist.connect(otherAccount).setIsSelfWhitelistDisabled(true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        whitelist.connect(otherAccount).addWhitelistedAddress(otherAccount),
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        whitelist.connect(otherAccount).addBatchWhitelist([otherAccount, batchedAccount]),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Self-whitelist", function () {
    it("Should self whitelist when ETH is sent", async function () {
      const { whitelist, otherAccount } = await loadFixture(deployWhitelistFixture);
      expect(await whitelist.isWhitelisted(otherAccount)).to.eq(false);
      const balanceChange = 67335443339441n;

      expect(
        await otherAccount.sendTransaction({
          to: whitelist,
          value: ethers.parseEther("1"),
        }),
      ).to.changeEtherBalance(otherAccount, -balanceChange);
      expect(await whitelist.isWhitelisted(otherAccount)).to.eq(true);
    });

    it("Should revert if self whitelist is disabled by owner", async function () {
      const { whitelist, otherAccount } = await loadFixture(deployWhitelistFixture);

      await whitelist.setIsSelfWhitelistDisabled(true);

      await expect(
        otherAccount.sendTransaction({
          to: whitelist,
          value: ethers.parseEther("1"),
        }),
      ).to.be.revertedWithCustomError(whitelist, "SelfWhitelistDisabled");
    });
  });

  describe("Checkwhitelist", function () {
    it("Should revert when called from non voltix contract", async function () {
      const { whitelist, otherAccount } = await loadFixture(deployWhitelistFixture);

      await expect(whitelist.checkWhitelist(otherAccount, 0)).to.be.revertedWithCustomError(
        whitelist,
        "NotVoltix",
      );
    });

    it("Should revert when locked or not whitelisted", async function () {
      const { whitelist, otherAccount, mockContract } = await loadFixture(deployWhitelistFixture);

      await whitelist.setVoltix(mockContract);

      await expect(
        whitelist.connect(mockContract).checkWhitelist(otherAccount, 0),
      ).to.be.revertedWithCustomError(whitelist, "Locked");

      await whitelist.setLocked(false);
      await expect(
        whitelist.connect(mockContract).checkWhitelist(otherAccount, 0),
      ).to.be.revertedWithCustomError(whitelist, "NotWhitelisted");
    });

    it("Should revert when USDC amount exceeds max address cap or already contributed", async function () {
      const { whitelist, mockOracleFail, mockOracleSuccess, otherAccount, mockContract } =
        await loadFixture(deployWhitelistFixture);

      await whitelist.setVoltix(mockContract);
      await whitelist.setOracle(mockOracleFail);
      await whitelist.setLocked(false);
      await whitelist.addWhitelistedAddress(otherAccount);

      await expect(
        whitelist.connect(mockContract).checkWhitelist(otherAccount, 0),
      ).to.be.revertedWithCustomError(whitelist, "MaxAddressCapOverflow");

      await whitelist.setOracle(mockOracleSuccess);
      await whitelist.connect(mockContract).checkWhitelist(otherAccount, 0);

      expect(await whitelist.contributed(otherAccount)).to.eq(10_000 * 1e6);

      await expect(
        whitelist.connect(mockContract).checkWhitelist(otherAccount, 0),
      ).to.be.revertedWithCustomError(whitelist, "AlreadyContributed");
    });
  });
});
