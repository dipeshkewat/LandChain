// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandChain
 * @notice Prototype land-registry contract for educational demonstration.
 *         Registers unique property IDs with an initial owner and document hash,
 *         allows only the current owner to transfer, and provides on-chain
 *         document-hash verification.
 * @dev NOT production-ready. Does not establish legal ownership.
 */
contract LandChain {
    struct Property {
        uint256 id;
        address owner;
        bytes32 documentHash;
        uint256 registeredAt;
        bool exists;
    }

    mapping(uint256 => Property) public properties;
    address public admin;

    // ── Events ──────────────────────────────────────────────────────────
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        bytes32 documentHash
    );

    event OwnershipTransferred(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner
    );

    // ── Modifiers ───────────────────────────────────────────────────────
    modifier onlyAdmin() {
        require(msg.sender == admin, "LandChain: caller is not admin");
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────
    constructor() {
        admin = msg.sender;
    }

    // ── Write functions ─────────────────────────────────────────────────

    /**
     * @notice Register a new property. Admin-only.
     * @param _id           Unique numeric property identifier (must be > 0).
     * @param _initialOwner Address of the first recorded owner.
     * @param _documentHash SHA-256 digest of the property deed document.
     */
    function registerProperty(
        uint256 _id,
        address _initialOwner,
        bytes32 _documentHash
    ) external onlyAdmin {
        require(_id > 0, "LandChain: ID must be greater than zero");
        require(!properties[_id].exists, "LandChain: property already registered");
        require(_initialOwner != address(0), "LandChain: owner cannot be zero address");
        require(_documentHash != bytes32(0), "LandChain: document hash cannot be empty");

        properties[_id] = Property({
            id: _id,
            owner: _initialOwner,
            documentHash: _documentHash,
            registeredAt: block.timestamp,
            exists: true
        });

        emit PropertyRegistered(_id, _initialOwner, _documentHash);
    }

    /**
     * @notice Transfer property ownership. Current owner only.
     * @param _id       Property ID to transfer.
     * @param _newOwner Address of the new owner.
     */
    function transferOwnership(uint256 _id, address _newOwner) external {
        require(properties[_id].exists, "LandChain: property does not exist");
        require(
            msg.sender == properties[_id].owner,
            "LandChain: caller is not the current owner"
        );
        require(_newOwner != address(0), "LandChain: new owner cannot be zero address");
        require(
            _newOwner != properties[_id].owner,
            "LandChain: new owner is same as current owner"
        );

        address previousOwner = properties[_id].owner;
        properties[_id].owner = _newOwner;

        emit OwnershipTransferred(_id, previousOwner, _newOwner);
    }

    // ── Read functions ──────────────────────────────────────────────────

    /**
     * @notice Retrieve property details.
     * @param _id Property ID.
     * @return owner          Current recorded owner.
     * @return documentHash   Registered document digest.
     * @return registeredAt   Block timestamp of registration.
     */
    function getProperty(uint256 _id)
        external
        view
        returns (address owner, bytes32 documentHash, uint256 registeredAt)
    {
        require(properties[_id].exists, "LandChain: property does not exist");
        Property storage p = properties[_id];
        return (p.owner, p.documentHash, p.registeredAt);
    }

    /**
     * @notice Compare a candidate hash against the registered document hash.
     * @param _id            Property ID.
     * @param _candidateHash Hash to compare.
     * @return matches       True if hashes are equal.
     */
    function verifyDocument(uint256 _id, bytes32 _candidateHash)
        external
        view
        returns (bool matches)
    {
        require(properties[_id].exists, "LandChain: property does not exist");
        return properties[_id].documentHash == _candidateHash;
    }
}
