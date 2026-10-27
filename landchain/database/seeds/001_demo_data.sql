-- LandChain Seed Data: Synthetic demonstration records
-- Run with: psql -d landchain -f 001_demo_data.sql

-- Demo admin user (password: admin123 — bcrypt hash)
INSERT INTO users (id, name, email, password_hash, wallet_address, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Dipesh Kewat',
    'admin@landchain.demo',
    '$2b$10$iBxN6JEzldjS2pEug.c4C.OwR08L5p5YkcxTMGLIkvzCeT.z5YicO',
    '0x1234567890abcdef1234567890abcdef12345678',
    'admin'
) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, wallet_address = EXCLUDED.wallet_address;

-- Demo property owner
INSERT INTO users (id, name, email, password_hash, wallet_address, role)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Chirag Khaire',
    'owner@landchain.demo',
    '$2b$10$iBxN6JEzldjS2pEug.c4C.OwR08L5p5YkcxTMGLIkvzCeT.z5YicO',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    'owner'
) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, wallet_address = EXCLUDED.wallet_address;

-- Demo viewer
INSERT INTO users (id, name, email, password_hash, wallet_address, role)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'Public Viewer',
    'viewer@landchain.demo',
    '$2b$10$iBxN6JEzldjS2pEug.c4C.OwR08L5p5YkcxTMGLIkvzCeT.z5YicO',
    NULL,
    'viewer'
) ON CONFLICT (email) DO NOTHING;

-- Synthetic properties
INSERT INTO properties (id, property_code, location, area_sq_m, description, document_hash, current_owner_address, blockchain_property_id, chain_status, created_by)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'LAND-1001',
    'Plot 42, Sector 7, New District, Metro City',
    1250.00,
    'Residential plot with boundary walls, east-facing, near main road.',
    'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    '0x1234567890abcdef1234567890abcdef12345678',
    1001,
    'confirmed',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'LAND-1002',
    'Plot 15, Block B, Industrial Zone, Harbor Town',
    3500.00,
    'Commercial land near the port, suitable for warehouse construction.',
    'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    1002,
    'confirmed',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'LAND-1003',
    'Survey No. 88, Village Greenfield, Rural District',
    8000.00,
    'Agricultural land with irrigation access and road frontage.',
    'abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    '0x1234567890abcdef1234567890abcdef12345678',
    1003,
    'pending',
    'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (property_code) DO NOTHING;

-- Sample transfers
INSERT INTO ownership_transfers (property_id, from_address, to_address, transaction_hash, block_number, status)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    '0x0000000000000000000000000000000000000000',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
    100,
    'confirmed'
)
ON CONFLICT (transaction_hash) DO NOTHING;

-- Sample audit entries
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'PROPERTY_REGISTERED',
    'property',
    'b0000000-0000-0000-0000-000000000001',
    '{"property_code": "LAND-1001", "owner": "0x1234567890abcdef1234567890abcdef12345678"}'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'PROPERTY_REGISTERED',
    'property',
    'b0000000-0000-0000-0000-000000000002',
    '{"property_code": "LAND-1002", "owner": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"}'
);
