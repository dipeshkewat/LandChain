const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandChain", function () {
  let landChain;
  let admin, owner1, owner2, nonAdmin;

  // Sample document hash (SHA-256 of arbitrary bytes)
  const DOC_HASH = ethers.keccak256(ethers.toUtf8Bytes("sample-deed-document"));
  const DOC_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("modified-deed-document"));
  const ZERO_HASH = ethers.ZeroHash;
  const PROPERTY_ID = 1001;

  beforeEach(async function () {
    [admin, owner1, owner2, nonAdmin] = await ethers.getSigners();
    const LandChain = await ethers.getContractFactory("LandChain");
    landChain = await LandChain.deploy();
  });

  // ── Constructor ─────────────────────────────────────────────────────
  describe("constructor", function () {
    it("should set deployer as admin", async function () {
      expect(await landChain.admin()).to.equal(admin.address);
    });
  });

  // ── registerProperty ────────────────────────────────────────────────
  describe("registerProperty", function () {
    it("should register a valid property and emit event", async function () {
      await expect(
        landChain.registerProperty(PROPERTY_ID, owner1.address, DOC_HASH)
      )
        .to.emit(landChain, "PropertyRegistered")
        .withArgs(PROPERTY_ID, owner1.address, DOC_HASH);

      const prop = await landChain.properties(PROPERTY_ID);
      expect(prop.exists).to.be.true;
      expect(prop.owner).to.equal(owner1.address);
      expect(prop.documentHash).to.equal(DOC_HASH);
    });

    it("should revert when non-admin calls registerProperty", async function () {
      await expect(
        landChain.connect(nonAdmin).registerProperty(PROPERTY_ID, owner1.address, DOC_HASH)
      ).to.be.revertedWith("LandChain: caller is not admin");
    });

    it("should revert when property ID is zero", async function () {
      await expect(
        landChain.registerProperty(0, owner1.address, DOC_HASH)
      ).to.be.revertedWith("LandChain: ID must be greater than zero");
    });

    it("should revert when registering duplicate property ID", async function () {
      await landChain.registerProperty(PROPERTY_ID, owner1.address, DOC_HASH);
      await expect(
        landChain.registerProperty(PROPERTY_ID, owner2.address, DOC_HASH_2)
      ).to.be.revertedWith("LandChain: property already registered");
    });

    it("should revert when owner is zero address", async function () {
      await expect(
        landChain.registerProperty(PROPERTY_ID, ethers.ZeroAddress, DOC_HASH)
      ).to.be.revertedWith("LandChain: owner cannot be zero address");
    });

    it("should revert when document hash is empty", async function () {
      await expect(
        landChain.registerProperty(PROPERTY_ID, owner1.address, ZERO_HASH)
      ).to.be.revertedWith("LandChain: document hash cannot be empty");
    });
  });

  // ── transferOwnership ───────────────────────────────────────────────
  describe("transferOwnership", function () {
    beforeEach(async function () {
      await landChain.registerProperty(PROPERTY_ID, owner1.address, DOC_HASH);
    });

    it("should transfer to valid different address and emit event", async function () {
      await expect(
        landChain.connect(owner1).transferOwnership(PROPERTY_ID, owner2.address)
      )
        .to.emit(landChain, "OwnershipTransferred")
        .withArgs(PROPERTY_ID, owner1.address, owner2.address);

      const prop = await landChain.properties(PROPERTY_ID);
      expect(prop.owner).to.equal(owner2.address);
    });

    it("should revert when non-owner tries transfer", async function () {
      await expect(
        landChain.connect(nonAdmin).transferOwnership(PROPERTY_ID, owner2.address)
      ).to.be.revertedWith("LandChain: caller is not the current owner");
    });

    it("should revert when property does not exist", async function () {
      await expect(
        landChain.connect(owner1).transferOwnership(9999, owner2.address)
      ).to.be.revertedWith("LandChain: property does not exist");
    });

    it("should revert when transferring to zero address", async function () {
      await expect(
        landChain.connect(owner1).transferOwnership(PROPERTY_ID, ethers.ZeroAddress)
      ).to.be.revertedWith("LandChain: new owner cannot be zero address");
    });

    it("should revert when transferring to current owner", async function () {
      await expect(
        landChain.connect(owner1).transferOwnership(PROPERTY_ID, owner1.address)
      ).to.be.revertedWith("LandChain: new owner is same as current owner");
    });
  });

  // ── getProperty ─────────────────────────────────────────────────────
  describe("getProperty", function () {
    it("should return property details", async function () {
      await landChain.registerProperty(PROPERTY_ID, owner1.address, DOC_HASH);
      const [owner, docHash, registeredAt] = await landChain.getProperty(PROPERTY_ID);
      expect(owner).to.equal(owner1.address);
      expect(docHash).to.equal(DOC_HASH);
      expect(registeredAt).to.be.greaterThan(0);
    });

    it("should revert for unknown property", async function () {
      await expect(
        landChain.getProperty(9999)
      ).to.be.revertedWith("LandChain: property does not exist");
    });
  });

  // ── verifyDocument ──────────────────────────────────────────────────
  describe("verifyDocument", function () {
    beforeEach(async function () {
      await landChain.registerProperty(PROPERTY_ID, owner1.address, DOC_HASH);
    });

    it("should return true for matching hash", async function () {
      expect(await landChain.verifyDocument(PROPERTY_ID, DOC_HASH)).to.be.true;
    });

    it("should return false for non-matching hash", async function () {
      expect(await landChain.verifyDocument(PROPERTY_ID, DOC_HASH_2)).to.be.false;
    });

    it("should revert for unknown property", async function () {
      await expect(
        landChain.verifyDocument(9999, DOC_HASH)
      ).to.be.revertedWith("LandChain: property does not exist");
    });
  });
});
