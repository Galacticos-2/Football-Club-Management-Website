const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { upload } = require("../middleware/uploadMulter");

/**
 * ==========================================
 * GET ACTIVE EVENT
 * ==========================================
 * GET /api/events/active
 */
router.get("/active", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        key,
        enabled,
        config,
        music_enabled,
        music_url
      FROM events
      WHERE enabled = true
      LIMIT 1
    `);

    if (!rows.length) return res.json(null);

    const event = rows[0];

    res.json({
      key: event.key,
      enabled: event.enabled,
      config:
        typeof event.config === "string"
          ? JSON.parse(event.config)
          : event.config || {},
      music_enabled: !!event.music_enabled,
      music_url: event.music_url || null,
    });
  } catch (err) {
    console.error("GET /events/active error:", err.message);
    res.status(500).json({ message: "Failed to load active event" });
  }
});

/**
 * ==========================================
 * 🎵 UPLOAD MUSIC FOR EVENT (CHRISTMAS / BIRTHDAY)
 * ==========================================
 * POST /api/events/:key/music
 */
router.post("/:key/music", upload.single("music"), async (req, res) => {
  const { key } = req.params;

  // ✅ Chỉ cho phép các event hợp lệ
  if (!["christmas", "birthday"].includes(key)) {
    return res.status(400).json({ message: "Invalid event key" });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No music file uploaded" });
    }

    // ✅ Đường dẫn public tuyệt đối cho frontend
    const musicUrl = `/uploads/events/${key}/${req.file.filename}`;

    // ✅ QUAN TRỌNG: SET music_enabled = true
    await pool.query(
      `
      UPDATE events
      SET
        music_url = $1,
        music_enabled = true
      WHERE key = $2
      `,
      [musicUrl, key]
    );

    res.json({
      success: true,
      music_url: musicUrl,
    });
  } catch (err) {
    console.error("POST /events/:key/music error:", err.message);
    res.status(500).json({ message: "Failed to upload music" });
  }
});

/**
 * ==========================================
 * ENABLE ONE EVENT (ADMIN)
 * ==========================================
 * PUT /api/events/:key/enable
 */
router.put("/:key/enable", async (req, res) => {
  const { key } = req.params;
  const { greeting } = req.body || {};

  try {
    // 1️⃣ Disable all events
    await pool.query("UPDATE events SET enabled = false");

    let query;
    let params;

    if (key === "christmas") {
      query = `
        UPDATE events
        SET
          enabled = true,
          config = jsonb_set(
            COALESCE(config, '{}'),
            '{greeting}',
            to_jsonb($2::text),
            true
          )
        WHERE key = $1
        RETURNING *
      `;
      params = [key, greeting || "Chúc mừng Giáng Sinh – Hala Madrid 🎄"];
    } else {
      query = `
        UPDATE events
        SET enabled = true
        WHERE key = $1
        RETURNING *
      `;
      params = [key];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows[0] || null);
  } catch (err) {
    console.error("PUT /events/:key/enable error:", err.message);
    res.status(500).json({ message: "Failed to enable event" });
  }
});

/**
 * ==========================================
 * DISABLE ALL EVENTS
 * ==========================================
 * PUT /api/events/disable
 */
router.put("/disable", async (req, res) => {
  try {
    await pool.query("UPDATE events SET enabled = false");
    res.json(null);
  } catch (err) {
    console.error("PUT /events/disable error:", err.message);
    res.status(500).json({ message: "Failed to disable events" });
  }
});

module.exports = router;
