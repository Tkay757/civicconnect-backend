import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM contacts ORDER BY is_emergency DESC, category ASC').all();
  const contacts = rows.map((c) => ({
    id: c.id,
    name: c.name,
    department: c.department,
    category: c.category,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    hours: c.hours,
    address: c.address,
    avatar: c.avatar,
    isEmergency: Boolean(c.is_emergency),
  }));

  res.json({ success: true, count: contacts.length, data: contacts });
});

export default router;
