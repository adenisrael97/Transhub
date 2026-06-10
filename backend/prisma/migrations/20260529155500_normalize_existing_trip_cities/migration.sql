-- Data migration: canonicalize existing trip city names so they match the new
-- write-path normalization (normalizeCity) and the now case-sensitive search.
-- initcap + regexp_replace(btrim(...)) mirrors normalizeCity exactly:
--   trim → collapse internal whitespace → Title-Case each word.
-- After this, the (from, to, departureTime) index serves search equality lookups.
UPDATE "trips"
SET "from" = initcap(regexp_replace(btrim("from"), '\s+', ' ', 'g')),
    "to"   = initcap(regexp_replace(btrim("to"),   '\s+', ' ', 'g'))
WHERE "from" <> initcap(regexp_replace(btrim("from"), '\s+', ' ', 'g'))
   OR "to"   <> initcap(regexp_replace(btrim("to"),   '\s+', ' ', 'g'));
