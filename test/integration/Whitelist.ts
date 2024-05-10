import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

// const SEPOLIA_ADDRESSES = {
//   v3CoreFactoryAddress: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
//   multicallAddress: '0xD7F33bCdb21b359c8ee6F0251d30E94832baAd07',
//   quoterAddress: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
//   v3MigratorAddress: '0x729004182cF005CEC8Bd85df140094b6aCbe8b15',
//   nonfungiblePositionManagerAddress: '0x1238536071E1c677A632429e3655c799b22cDA52',
//   tickLensAddress: '0xd7f33bcdb21b359c8ee6f0251d30e94832baad07'
// }

describe("VultisigWhitelisted with Whitelist", function () {
  async function deployVultisigWhitelistedFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const VultisigWhitelisted = await ethers.getContractFactory("VultisigWhitelisted");
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const vultisig = await VultisigWhitelisted.deploy([]);
    const whitelist = await Whitelist.deploy();

    await whitelist.setVultisig(vultisig);

    return { vultisig, whitelist, owner, otherAccount };
  }

  describe("Transfer", function () {
    it("Should transfer when whitelist contract is not set", async function () {
      const amount = ethers.parseEther("1000");
      const { vultisig, owner, otherAccount } = await loadFixture(deployVultisigWhitelistedFixture);
      expect(await vultisig.transfer(otherAccount.address, amount)).to.changeTokenBalances(
        vultisig,
        [owner.address, otherAccount.address],
        [-amount, amount],
      );
    });

    // it("Should transfer when checkWhitelist succeeds", async function () {
    //   const amount = ethers.parseEther("1000");
    //   const { vultisig, owner, otherAccount, mockWhitelistSuccess } = await loadFixture(
    //     deployVultisigWhitelistedFixture,
    //   );
    //   await vultisig.setWhitelistContract(mockWhitelistSuccess);
    //   expect(await vultisig.transfer(otherAccount.address, amount)).to.changeTokenBalances(
    //     vultisig,
    //     [owner.address, otherAccount.address],
    //     [-amount, amount],
    //   );
    // });

    // it("Should revert transfer when checkWhitelist reverts", async function () {
    //   const amount = ethers.parseEther("1000");
    //   const { vultisig, otherAccount, mockWhitelistFail } = await loadFixture(
    //     deployVultisigWhitelistedFixture,
    //   );

    //   await vultisig.setWhitelistContract(mockWhitelistFail);
    //   await expect(vultisig.transfer(otherAccount.address, amount)).to.be.reverted;
    // });
  });
});
