import express from 'express';
import { db } from '../db.js';
import { calculateDistanceMeters } from '../spatial.js';
import { calculatePriority } from '../priorityEngine.js';

const router = express.Router();

// Helper to fetch full issue details with upvotes and comments
function getFullIssueById(id, currentUserId = null) {
  const issueStmt = db.prepare('SELECT * FROM issues WHERE id = ?');
  const issue = issueStmt.get(id);
  if (!issue) return null;

  // Upvotes
  const upvotesStmt = db.prepare('SELECT user_id FROM upvotes WHERE issue_id = ?');
  const upvoteRows = upvotesStmt.all(id);
  const upvotes = upvoteRows.map((r) => r.user_id);

  // Comments
  const commentsStmt = db.prepare('SELECT * FROM comments WHERE issue_id = ? ORDER BY created_at ASC');
  const comments = commentsStmt.all(id).map((c) => ({
    id: c.id,
    userId: c.user_id,
    userName: c.user_name,
    userHandle: c.user_handle,
    userAvatar: c.user_avatar,
    text: c.text,
    createdAt: c.created_at,
  }));

  // Timeline
  const timelineStmt = db.prepare('SELECT * FROM timeline WHERE issue_id = ? ORDER BY timestamp ASC');
  const timeline = timelineStmt.all(id);

  // Priority Calculation
  const priorityInfo = calculatePriority(issue.severity, upvotes.length, issue.created_at);

  return {
    id: issue.id,
    title: issue.title,
    category: issue.category,
    categoryLabel: issue.category_label,
    description: issue.description,
    locationName: issue.location_name,
    lat: issue.lat,
    lng: issue.lng,
    severity: issue.severity,
    status: issue.status,
    imageUrl: issue.image_url,
    reportedBy: {
      id: issue.reporter_id,
      name: issue.reporter_name,
      handle: issue.reporter_handle,
      avatar: issue.reporter_avatar,
    },
    authorityNotes: issue.authority_notes,
    assignedWorker: issue.assigned_worker,
    createdAt: issue.created_at,
    upvotes,
    comments,
    timeline,
    priorityScore: priorityInfo.totalScore,
    priorityLevel: priorityInfo.priorityLevel,
    priorityDetails: priorityInfo,
    hasUpvoted: currentUserId ? upvotes.includes(currentUserId) : false,
  };
}

// 1. GET /api/issues - List all issues with filters & priority
router.get('/', (req, res) => {
  const { category, priority, status, search, user_lat, user_lng, user_id, sort } = req.query;

  const rows = db.prepare('SELECT id FROM issues ORDER BY created_at DESC').all();
  let issues = rows.map((r) => getFullIssueById(r.id, user_id)).filter(Boolean);

  // Calculate distance if user coords provided
  if (user_lat && user_lng) {
    const uLat = parseFloat(user_lat);
    const uLng = parseFloat(user_lng);
    issues = issues.map((i) => ({
      ...i,
      distanceMeters: calculateDistanceMeters(uLat, uLng, i.lat, i.lng),
    }));
  }

  // Filters
  if (category && category !== 'all') {
    issues = issues.filter((i) => i.category === category);
  }
  if (priority && priority !== 'all') {
    issues = issues.filter((i) => i.priorityLevel === priority);
  }
  if (status && status !== 'all') {
    issues = issues.filter((i) => i.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    issues = issues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.locationName.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'upvotes') {
    issues.sort((a, b) => b.upvotes.length - a.upvotes.length);
  } else if (sort === 'distance' && user_lat && user_lng) {
    issues.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  } else {
    // Default: Priority highest first
    const weights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    issues.sort((a, b) => {
      const diff = (weights[b.priorityLevel] || 0) - (weights[a.priorityLevel] || 0);
      if (diff !== 0) return diff;
      return b.upvotes.length - a.upvotes.length;
    });
  }

  res.json({ success: true, count: issues.length, data: issues });
});

// 2. GET /api/issues/nearby - Spatial radius check for duplicate detection (Slide 4 Step 4)
router.get('/nearby', (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
  }

  const queryLat = parseFloat(lat);
  const queryLng = parseFloat(lng);
  const radiusMeters = radius ? parseFloat(radius) : 350;

  const rows = db.prepare("SELECT id, lat, lng FROM issues WHERE status != 'resolved'").all();

  const nearby = rows
    .map((r) => {
      const distance = calculateDistanceMeters(queryLat, queryLng, r.lat, r.lng);
      return { id: r.id, distance };
    })
    .filter((r) => r.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .map((r) => {
      const issue = getFullIssueById(r.id);
      return { ...issue, distance: r.distance };
    });

  res.json({ success: true, count: nearby.length, data: nearby });
});

// 2b. GET /api/issues/:id - Get single issue details
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const issue = getFullIssueById(id);
  if (!issue) {
    return res.status(404).json({ success: false, message: 'Issue not found.' });
  }
  res.json({ success: true, data: issue });
});

// 3. POST /api/issues - Create new civic report
router.post('/', (req, res) => {
  const {
    title,
    category,
    categoryLabel,
    description,
    locationName,
    lat,
    lng,
    severity,
    imageUrl,
    reporterId,
    reporterName,
    reporterHandle,
    reporterAvatar,
  } = req.body;

  if (!title || !lat || !lng || !severity) {
    return res.status(400).json({ success: false, message: 'Missing required issue fields.' });
  }

  // Count existing to generate ID
  const countRow = db.prepare('SELECT COUNT(*) as count FROM issues').get();
  const nextNum = (countRow.count || 0) + 1;
  const id = `CC-2026-${String(nextNum).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO issues (
      id, title, category, category_label, description, location_name,
      lat, lng, severity, status, image_url, reporter_id, reporter_name,
      reporter_handle, reporter_avatar, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', ?, ?, ?, ?, ?, ?
    )
  `);

  insertStmt.run(
    id,
    title,
    category || 'pothole',
    categoryLabel || 'Road Hazard',
    description || '',
    locationName || 'Pinpointed GPS Location',
    parseFloat(lat),
    parseFloat(lng),
    severity,
    imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000',
    reporterId || 'usr-1',
    reporterName || 'Citizen',
    reporterHandle || 'citizen_reporter',
    reporterAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    now
  );

  // Automatically add initial upvote from reporter
  db.prepare('INSERT OR IGNORE INTO upvotes (id, issue_id, user_id, created_at) VALUES (?, ?, ?, ?)').run(
    `v-${Date.now()}`,
    id,
    reporterId || 'usr-1',
    now
  );

  // Initial timeline
  db.prepare('INSERT INTO timeline (id, issue_id, status, actor, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(
    `tl-${id}-1`,
    id,
    'reported',
    `${reporterName || 'Citizen'} (Citizen)`,
    'Filed complaint with verified GPS location and photo.',
    now
  );

  const created = getFullIssueById(id);
  res.status(201).json({ success: true, data: created });
});

// 4. POST /api/issues/:id/upvote - Atomic upvote toggle with anti-spam
router.post('/:id/upvote', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required to upvote.' });
  }

  const existing = db.prepare('SELECT id FROM upvotes WHERE issue_id = ? AND user_id = ?').get(id, userId);

  let action = 'added';
  if (existing) {
    db.prepare('DELETE FROM upvotes WHERE id = ?').run(existing.id);
    action = 'removed';
  } else {
    db.prepare('INSERT INTO upvotes (id, issue_id, user_id, created_at) VALUES (?, ?, ?, ?)').run(
      `v-${Date.now()}`,
      id,
      userId,
      new Date().toISOString()
    );
  }

  const updated = getFullIssueById(id, userId);
  res.json({ success: true, action, data: updated });
});

// 5. POST /api/issues/:id/comments - Add citizen comment
router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const { userId, userName, userHandle, userAvatar, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required.' });
  }

  const commentId = `cm-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO comments (id, issue_id, user_id, user_name, user_handle, user_avatar, text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(commentId, id, userId, userName || 'Citizen', userHandle || 'citizen', userAvatar || '', text.trim(), now);

  const updated = getFullIssueById(id);
  res.status(201).json({ success: true, data: updated });
});

// 6. PATCH /api/issues/:id/status - Municipal Authority Review and Update (Slide 8 & 9)
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, authorityNotes, assignedWorker, actorName } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  db.prepare('UPDATE issues SET status = ?, authority_notes = ?, assigned_worker = ? WHERE id = ?').run(
    status,
    authorityNotes || '',
    assignedWorker || '',
    id
  );

  const now = new Date().toISOString();
  db.prepare('INSERT INTO timeline (id, issue_id, status, actor, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(
    `tl-${id}-${Date.now()}`,
    id,
    status,
    actorName || 'Municipal Operations Officer',
    authorityNotes || `Status updated to ${status.replace('_', ' ').toUpperCase()}`,
    now
  );

  const updated = getFullIssueById(id);
  res.json({ success: true, data: updated });
});

export default router;
