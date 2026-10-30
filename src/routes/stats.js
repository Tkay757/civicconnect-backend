import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const totalReports = db.prepare('SELECT COUNT(*) as count FROM issues').get().count;
  const highPriority = db.prepare("SELECT COUNT(*) as count FROM issues WHERE severity = 'HIGH'").get().count;
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'in_progress' OR status = 'under_review'").get().count;
  const resolved = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved'").get().count;
  const totalUpvotes = db.prepare('SELECT COUNT(*) as count FROM upvotes').get().count;
  const duplicatesPrevented = Math.max(0, totalUpvotes - totalReports);

  res.json({
    success: true,
    data: {
      totalReports,
      highPriority,
      inProgress,
      resolved,
      totalUpvotes,
      duplicatesPrevented,
    },
  });
});

export default router;
