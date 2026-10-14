/**
 * Blockchain adapter — isolated ethers.js service for LandChain contract interaction.
 *
 * This module wraps all EVM calls behind a service so the rest of the backend
 * never touches ethers directly. When RPC_URL or CONTRACT_ADDRESS are not
 * configured, methods return graceful "not connected" responses.
 *
 * IMPORTANT: Remix VM is NOT a standard JSON-RPC node reachable by an external
 * app. For local integrated testing, use Hardhat Network (`npx hardhat node`)
 * and deploy the contract there.
 */
const { ethers } = require("ethers");

// Minimal ABI for LandChain — only the functions we call from the backend
const LANDCHAIN_ABI = [
  "function admin() view returns (address)",
  "function registerProperty(uint256 _id, address _initialOwner, bytes32 _documentHash)",
  "function transferOwnership(uint256 _id, address _newOwner)",
  "function getProperty(uint256 _id) view returns (address owner, bytes32 documentHash, uint256 registeredAt)",
  "function verifyDocument(uint256 _id, bytes32 _candidateHash) view returns (bool matches)",
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, bytes32 documentHash)",
  "event OwnershipTransferred(uint256 indexed propertyId, address indexed previousOwner, address indexed newOwner)",
];

let provider = null;
let contract = null;

/**
 * Initialize the blockchain connection. Safe to call multiple times.
 * Returns false if env vars are missing — the app still works in "offline" mode.
 */
function init() {
  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.LANDCHAIN_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    console.warn("[blockchain] RPC_URL or LANDCHAIN_CONTRACT_ADDRESS not set — adapter running in offline mode.");
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(rpcUrl);
    contract = new ethers.Contract(contractAddress, LANDCHAIN_ABI, provider);
    console.log("[blockchain] Connected to", rpcUrl, "contract:", contractAddress);
    return true;
  } catch (err) {
    console.error("[blockchain] Failed to initialize:", err.message);
    return false;
  }
}

/** @returns {boolean} Whether a live contract connection is available. */
function isConnected() {
  return contract !== null;
}

/**
 * Read property from the on-chain contract.
 * @param {string|number} propertyId
 * @returns {Promise<{ owner: string, documentHash: string, registeredAt: number } | null>}
 */
async function getProperty(propertyId) {
  if (!contract) return null;
  try {
    const [owner, documentHash, registeredAt] = await contract.getProperty(BigInt(propertyId));
    return {
      owner,
      documentHash,
      registeredAt: Number(registeredAt),
    };
  } catch (err) {
    console.error("[blockchain] getProperty error:", err.message);
    return null;
  }
}

/**
 * Verify a document hash on-chain.
 * @param {string|number} propertyId
 * @param {string} candidateHash - 0x-prefixed bytes32
 * @returns {Promise<boolean | null>} null if not connected
 */
async function verifyDocument(propertyId, candidateHash) {
  if (!contract) return null;
  try {
    return await contract.verifyDocument(BigInt(propertyId), candidateHash);
  } catch (err) {
    console.error("[blockchain] verifyDocument error:", err.message);
    return null;
  }
}

/**
 * Register a property on-chain using a signer (admin wallet).
 * @param {ethers.Wallet} signer
 * @param {string|number} propertyId
 * @param {string} ownerAddress
 * @param {string} documentHash - 0x-prefixed bytes32
 * @returns {Promise<{ txHash: string, blockNumber: number } | null>}
 */
async function registerProperty(signer, propertyId, ownerAddress, documentHash) {
  if (!contract) return null;
  try {
    const connectedContract = contract.connect(signer);
    const tx = await connectedContract.registerProperty(BigInt(propertyId), ownerAddress, documentHash);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("[blockchain] registerProperty error:", err.message);
    throw err;
  }
}

/**
 * Transfer ownership on-chain using the current owner's signer.
 * @param {ethers.Wallet} signer
 * @param {string|number} propertyId
 * @param {string} newOwnerAddress
 * @returns {Promise<{ txHash: string, blockNumber: number } | null>}
 */
async function transferOnChain(signer, propertyId, newOwnerAddress) {
  if (!contract) return null;
  try {
    const connectedContract = contract.connect(signer);
    const tx = await connectedContract.transferOwnership(BigInt(propertyId), newOwnerAddress);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("[blockchain] transferOwnership error:", err.message);
    throw err;
  }
}

/**
 * Get transaction receipt by hash.
 * @param {string} txHash
 * @returns {Promise<object | null>}
 */
async function getTransactionReceipt(txHash) {
  if (!provider) return null;
  try {
    return await provider.getTransactionReceipt(txHash);
  } catch (err) {
    console.error("[blockchain] getTransactionReceipt error:", err.message);
    return null;
  }
}

/**
 * Reconcile a property's on-chain state with the database cache.
 * @param {string|number} blockchainPropertyId
 * @param {{ current_owner_address: string, chain_status: string }} dbRecord
 * @returns {Promise<{ needsUpdate: boolean, onChainOwner?: string } | null>}
 */
async function reconcile(blockchainPropertyId, dbRecord) {
  const onChain = await getProperty(blockchainPropertyId);
  if (!onChain) return null;

  const needsUpdate =
    dbRecord.current_owner_address?.toLowerCase() !== onChain.owner.toLowerCase() ||
    dbRecord.chain_status !== "confirmed";

  return {
    needsUpdate,
    onChainOwner: onChain.owner,
  };
}

module.exports = {
  init,
  isConnected,
  getProperty,
  verifyDocument,
  registerProperty,
  transferOnChain,
  getTransactionReceipt,
  reconcile,
  LANDCHAIN_ABI,
};
