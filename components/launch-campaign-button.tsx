"use client";

import { launchCampaign } from "@/lib/actions";
import CampaignContract from '@/protocol/campaigns/out/Campaign.sol/Campaign.json';
import { ethers } from "ethers";


export default function LaunchCampaignButton(
  props: { campaign: Campaign, subdomain: string }
) {
  const launch = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask or another wallet to create a campaign.");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        const campaignABI = CampaignContract.abi;
        const campaignBytecode = CampaignContract.bytecode;

        // TODO make this actual data
        const creatorAddress = signer.address;
        const threshold = ethers.parseUnits(props.campaign.threshold.toString(), "ether");
        const name = props.campaign.name;

        const campaignFactory = new ethers.ContractFactory(campaignABI, campaignBytecode, signer);
        const campaign = await campaignFactory.deploy(creatorAddress, threshold, name);
        await campaign.waitForDeployment();
        const deployedAddress = await campaign.getAddress();

        const data = {
          sponsorEthAddress: creatorAddress,
          deployedAddress: deployedAddress
        };

        launchCampaign(data, { params: { subdomain: props.subdomain } }, null);
      } catch (error) {
        console.error(error);
      }
  };

  return (
    <button onClick={launch}>
      Launch campaign
    </button>
  );
}