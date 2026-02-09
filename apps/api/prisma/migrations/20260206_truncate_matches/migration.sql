-- Truncate all match-related data
-- Order matters due to foreign key constraints

-- 1. Delete bet_selections first (references both odds and matches)
DELETE FROM "bet_selections";

-- 2. Delete odds (references matches)
DELETE FROM "odds";

-- 3. Delete matches
DELETE FROM "matches";
