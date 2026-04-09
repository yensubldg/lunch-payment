SELECT
  COUNT(*) AS rows_with_image,
  SUM(CASE WHEN SUBSTR(LTRIM(imageData), 1, 1) = '[' THEN 1 ELSE 0 END) AS array_rows,
  SUM(
    CASE
      WHEN SUBSTR(LTRIM(imageData), 1, 1) = '['
        AND json_valid(imageData)
        AND COALESCE(
          (SELECT value FROM json_each(imageData) WHERE key = 0 LIMIT 1),
          imageData
        ) <> imageData
      THEN 1
      ELSE 0
    END
  ) AS rows_to_update,
  ROUND(SUM(LENGTH(imageData)) / 1024.0 / 1024.0, 2) AS total_mb,
  ROUND(
    SUM(
      CASE
        WHEN SUBSTR(LTRIM(imageData), 1, 1) = '[' AND json_valid(imageData)
          THEN LENGTH(COALESCE(
            (SELECT value FROM json_each(imageData) WHERE key = 0 LIMIT 1),
            imageData
          ))
        ELSE LENGTH(imageData)
      END
    ) / 1024.0 / 1024.0,
    2
  ) AS projected_mb_after
FROM bills
WHERE imageData IS NOT NULL
  AND TRIM(imageData) <> '';
