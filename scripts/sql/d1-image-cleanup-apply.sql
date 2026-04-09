UPDATE bills
SET imageData = COALESCE(
  (SELECT value FROM json_each(bills.imageData) WHERE key = 0 LIMIT 1),
  imageData
)
WHERE imageData IS NOT NULL
  AND TRIM(imageData) <> ''
  AND SUBSTR(LTRIM(imageData), 1, 1) = '['
  AND json_valid(imageData)
  AND COALESCE(
    (SELECT value FROM json_each(bills.imageData) WHERE key = 0 LIMIT 1),
    imageData
  ) <> imageData;
