SELECT
  COUNT(*) AS rows_with_image,
  SUM(CASE WHEN SUBSTR(LTRIM(imageData), 1, 1) = '[' THEN 1 ELSE 0 END) AS array_rows,
  ROUND(SUM(LENGTH(imageData)) / 1024.0 / 1024.0, 2) AS total_mb
FROM bills
WHERE imageData IS NOT NULL
  AND TRIM(imageData) <> '';

SELECT
  id,
  LENGTH(imageData) AS bytes
FROM bills
WHERE imageData IS NOT NULL
  AND TRIM(imageData) <> ''
ORDER BY bytes DESC
LIMIT 10;
