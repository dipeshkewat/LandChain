const request = require("supertest");
const crypto = require("crypto");
const app = require("../src/app");

describe("LandChain API Test Suite", () => {
  describe("GET /api/health", () => {
    it("should return status ok and blockchain connection status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(typeof res.body.blockchain_connected).toBe("boolean");
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe("Document Hashing Consistency (SHA-256)", () => {
    it("should compute consistent 64-character lowercase hex hashes for exact bytes", () => {
      const testBuffer = Buffer.from("Land deed record title 1001", "utf-8");
      const hash1 = crypto.createHash("sha256").update(testBuffer).digest("hex").toLowerCase();
      const hash2 = crypto.createHash("sha256").update(testBuffer).digest("hex").toLowerCase();

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should detect 1-byte alteration in document bytes", () => {
      const original = Buffer.from("Original land title agreement", "utf-8");
      const tampered = Buffer.from("Original land title agraement", "utf-8"); // 1 byte changed

      const hashOrig = crypto.createHash("sha256").update(original).digest("hex").toLowerCase();
      const hashTamp = crypto.createHash("sha256").update(tampered).digest("hex").toLowerCase();

      expect(hashOrig).not.toBe(hashTamp);
    });
  });

  describe("Authentication & Role Authorization", () => {
    it("should reject unauthenticated request to admin stats", async () => {
      const res = await request(app).get("/api/admin/stats");
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/i);
    });

    it("should reject registration with invalid email format", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "not-an-email",
        password: "password123",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed/i);
    });

    it("should reject registration with short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "123",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed/i);
    });
  });

  describe("Route Input Validation", () => {
    it("should reject non-UUID property ID on GET /api/properties/:id", async () => {
      const res = await request(app).get("/api/properties/not-a-uuid");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed/i);
    });

    it("should reject invalid transaction hash on GET /api/transactions/:hash", async () => {
      const res = await request(app).get("/api/transactions/invalid-hash-123");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed/i);
    });

    it("should reject transfer when unauthenticated", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000001";
      const res = await request(app)
        .post(`/api/properties/${fakeUuid}/transfer`)
        .send({ to_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" });
      expect(res.status).toBe(401);
    });
  });
});
