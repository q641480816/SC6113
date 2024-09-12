const { ethers } = require("ethers");
const abi = require('./abi/VotingCampaignContract.json').abi;
const CONSTANTS = require('./constants.json');

const UTILS = {
    sendTransactions: async (contractAddress, functionName, params) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);
            const tx = await contract[functionName](...params);
            console.log('Transaction sent:', tx);
            const receipt = await tx.wait();
            console.log('Transaction mined:', receipt);
            return receipt;
        } catch (error) {
            console.error('Error calling function:', error);
            throw error;
        }
    },
    readContract: async (contractAddress, functionName, params) => {
        try {
            const provider = new ethers.JsonRpcProvider(`http${CONSTANTS.ssl}://${CONSTANTS.rpcURL}`);
            const contract = new ethers.Contract(contractAddress, abi, provider);
            const res = await contract[functionName](...params);
            return res;
        } catch (error) {
            console.error('Error calling function:', error);
            throw error;
        }
    }
}

export default UTILS;