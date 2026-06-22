const express = require('express');
const router = express.Router();

module.exports = (pool) => {

  // ===== STUDENT DASHBOARD STATS =====
  router.get('/stats/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const total = await pool.query(
        'SELECT COUNT(*) FROM executions WHERE user_id = $1', [userId]
      );
      const success = await pool.query(
        'SELECT COUNT(*) FROM executions WHERE user_id = $1 AND is_success = true', [userId]
      );
      const errors = await pool.query(
        'SELECT COUNT(*) FROM executions WHERE user_id = $1 AND is_success = false', [userId]
      );

      const totalCount = parseInt(total.rows[0].count);
      const successCount = parseInt(success.rows[0].count);
      const errorCount = parseInt(errors.rows[0].count);
      const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

      res.json({
        total_submissions: totalCount,
        successful_runs: successCount,
        errors_detected: errorCount,
        success_rate: successRate,
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ===== RECENT SUBMISSIONS =====
  router.get('/submissions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT e.exec_id, e.language, e.is_success, e.executed_at,
                er.error_type
         FROM executions e
         LEFT JOIN errors er ON e.exec_id = er.exec_id
         WHERE e.user_id = $1
         ORDER BY e.executed_at DESC
         LIMIT 10`,
        [userId]
      );

      res.json(result.rows);

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ===== ERROR BREAKDOWN =====
  router.get('/errors/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT er.error_type, COUNT(*) as count
         FROM errors er
         JOIN executions e ON er.exec_id = e.exec_id
         WHERE e.user_id = $1
         GROUP BY er.error_type
         ORDER BY count DESC`,
        [userId]
      );

      res.json(result.rows);

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ===== LANGUAGE USAGE =====
  router.get('/languages/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT language, COUNT(*) as count
         FROM executions
         WHERE user_id = $1
         GROUP BY language
         ORDER BY count DESC`,
        [userId]
      );

      res.json(result.rows);

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ===== EDUCATOR STATS =====
  router.get('/educator/stats', async (req, res) => {
    try {
      const students = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'student'"
      );
      const todayExec = await pool.query(
        "SELECT COUNT(*) FROM executions WHERE DATE(executed_at) = CURRENT_DATE"
      );
      const atRisk = await pool.query(
        "SELECT COUNT(*) FROM ml_predictions WHERE risk_level IN ('High', 'Medium')"
      );
      const avgSuccess = await pool.query(
        `SELECT ROUND(AVG(CASE WHEN is_success THEN 100 ELSE 0 END)) as avg
         FROM executions`
      );

      res.json({
        total_students: parseInt(students.rows[0].count),
        submissions_today: parseInt(todayExec.rows[0].count),
        at_risk_count: parseInt(atRisk.rows[0].count),
        avg_success_rate: parseInt(avgSuccess.rows[0].avg) || 0,
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ===== EDUCATOR AT-RISK STUDENTS =====
  router.get('/educator/at-risk', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.first_name || ' ' || u.last_name as name,
                ml.risk_score, ml.risk_level, ml.common_error
         FROM ml_predictions ml
         JOIN users u ON ml.user_id = u.user_id
         ORDER BY ml.risk_score DESC`
      );

      res.json(result.rows);

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ===== EDUCATOR LANGUAGE USAGE =====
router.get('/educator/languages', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT language, COUNT(*) as count
       FROM executions
       GROUP BY language
       ORDER BY count DESC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

  // ===== EDUCATOR ERROR DISTRIBUTION =====
  router.get('/educator/errors', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT error_type, COUNT(*) as count
         FROM errors
         GROUP BY error_type
         ORDER BY count DESC`
      );

      res.json(result.rows);

    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};