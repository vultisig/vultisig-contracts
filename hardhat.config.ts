import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-erc1820"; // ERC777 is interacting with ERC1820 registry

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/" + vars.get("VULTISIG_ALCHEMY_KEY"),
        blockNumber: 19383515,
      },
    },
  },
};

export default config;
