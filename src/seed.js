import { db } from './db.js';

export function seedDatabase() {
  const issueCountStmt = db.prepare('SELECT COUNT(*) as count FROM issues');
  const result = issueCountStmt.get();

  if (result.count > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding initial database with realistic civic data...');

  // 1. Initial Issues
  const insertIssue = db.prepare(`
    INSERT INTO issues (
      id, title, category, category_label, description, location_name,
      lat, lng, severity, status, image_url, reporter_id, reporter_name,
      reporter_handle, reporter_avatar, authority_notes, assigned_worker, created_at
    ) VALUES (
      @id, @title, @category, @category_label, @description, @location_name,
      @lat, @lng, @severity, @status, @image_url, @reporter_id, @reporter_name,
      @reporter_handle, @reporter_avatar, @authority_notes, @assigned_worker, @created_at
    )
  `);

  const insertUpvote = db.prepare(`
    INSERT OR IGNORE INTO upvotes (id, issue_id, user_id, created_at)
    VALUES (@id, @issue_id, @user_id, @created_at)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (id, issue_id, user_id, user_name, user_handle, user_avatar, text, created_at)
    VALUES (@id, @issue_id, @user_id, @user_name, @user_handle, @user_avatar, @text, @created_at)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO timeline (id, issue_id, status, actor, note, timestamp)
    VALUES (@id, @issue_id, @status, @actor, @note, @timestamp)
  `);

  const insertContact = db.prepare(`
    INSERT INTO contacts (id, name, department, category, phone, whatsapp, email, hours, address, avatar, is_emergency)
    VALUES (@id, @name, @department, @category, @phone, @whatsapp, @email, @hours, @address, @avatar, @is_emergency)
  `);

  // Sample Issues
  const initialIssues = [
    {
      id: 'CC-2026-001',
      title: 'Large Deep Pothole Near College Main Entrance',
      category: 'pothole',
      category_label: 'Road Pothole',
      description: 'Deep hazardous crater pothole right outside College Gate 2 on Gandhi Road. Two 2-wheelers skidded during evening rain. Immediate repair required before peak student traffic!',
      location_name: 'Opposite Engineering College Gate 2, Gandhi Road',
      lat: 13.0838,
      lng: 80.2715,
      severity: 'HIGH',
      status: 'in_progress',
      image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000&auto=format&fit=crop&q=80',
      reporter_id: 'usr-1',
      reporter_name: 'Thanish Kanna',
      reporter_handle: 'thanish_kanna',
      reporter_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authority_notes: 'Maintenance team #4 scheduled asphalt levelling by 6:00 PM today.',
      assigned_worker: 'Road Works Division Crew #4',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'CC-2026-002',
      title: 'Persistent Sewage Drainage Overflow in Market Lane',
      category: 'drainage',
      category_label: 'Drainage & Sewage Blockage',
      description: 'Severely clogged storm drain overflowing foul water onto vegetable market walkway. Creating acute health hazards and bad odor for vendors and shoppers.',
      location_name: 'Vegetable Market Lane, 4th Cross Street',
      lat: 13.0851,
      lng: 80.2688,
      severity: 'MEDIUM',
      status: 'under_review',
      image_url: '/themes/drainage.jpg',
      reporter_id: 'usr-2',
      reporter_name: 'Sam Jony',
      reporter_handle: 'sam_jony',
      reporter_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      authority_notes: 'Sanitation jetting vehicle requested for Tuesday morning clearout.',
      assigned_worker: 'Sanitation Suction Jetting Tanker #2',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'CC-2026-003',
      title: 'Overflowing Illegal Garbage Dump at Children Park Corner',
      category: 'garbage',
      category_label: 'Garbage Dump & Waste',
      description: 'Municipal trash bin overturned and plastic waste scattered across park boundary. Stray animals foraging, posing danger to small children playing nearby.',
      location_name: 'Nehru Children Park, South Gate',
      lat: 13.0809,
      lng: 80.2730,
      severity: 'MEDIUM',
      status: 'reported',
      image_url: '/themes/garbage.jpg',
      reporter_id: 'usr-3',
      reporter_name: 'Sri Ranjini',
      reporter_handle: 'sri_ranjini',
      reporter_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      authority_notes: '',
      assigned_worker: '',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'CC-2026-004',
      title: 'Non-functional Streetlights on Bus Stand Access Road',
      category: 'streetlight',
      category_label: 'Broken Streetlight / Dark Area',
      description: 'Row of three street poles completely dark for over a week. Pedestrians feeling unsafe walking after sunset from the bus terminus.',
      location_name: 'Bus Terminus East Approach Road',
      lat: 13.0815,
      lng: 80.2662,
      severity: 'MEDIUM',
      status: 'resolved',
      image_url: '/themes/lights.jpg',
      reporter_id: 'usr-2',
      reporter_name: 'Sam Jony',
      reporter_handle: 'sam_jony',
      reporter_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      authority_notes: 'Bulbs replaced with 90W LED high-efficiency luminaire.',
      assigned_worker: 'Electrical Lineman Crew',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'CC-2026-005',
      title: 'Major Drinking Water Pipeline Leak Flooding Road',
      category: 'water_leak',
      category_label: 'Main Water Pipe Leak',
      description: 'Underground drinking water main cracked, wasting thousands of liters of clean water and eroding the road foundation.',
      location_name: 'Corner of 2nd Avenue and Temple Street',
      lat: 13.0862,
      lng: 80.2741,
      severity: 'HIGH',
      status: 'reported',
      image_url: '/themes/water.jpg',
      reporter_id: 'usr-1',
      reporter_name: 'Thanish Kanna',
      reporter_handle: 'thanish_kanna',
      reporter_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authority_notes: '',
      assigned_worker: '',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  for (const issue of initialIssues) {
    insertIssue.run(issue);

    // Initial timeline
    insertTimeline.run({
      id: `tl-${issue.id}-1`,
      issue_id: issue.id,
      status: 'reported',
      actor: `${issue.reporter_name} (Citizen)`,
      note: 'Complaint filed with verified GPS location and photo.',
      timestamp: issue.created_at,
    });
  }

  // Seed 45 upvotes for issue 1 (Matching Slide 6 example!)
  for (let i = 1; i <= 45; i++) {
    insertUpvote.run({
      id: `v-1-${i}`,
      issue_id: 'CC-2026-001',
      user_id: i <= 3 ? `usr-${i}` : `voter-${i}`,
      created_at: new Date().toISOString(),
    });
  }

  // Seed 24 upvotes for issue 2
  for (let i = 1; i <= 24; i++) {
    insertUpvote.run({
      id: `v-2-${i}`,
      issue_id: 'CC-2026-002',
      user_id: `voter-drain-${i}`,
      created_at: new Date().toISOString(),
    });
  }

  // Seed comments
  insertComment.run({
    id: 'cm-1',
    issue_id: 'CC-2026-001',
    user_id: 'usr-2',
    user_name: 'Sam Jony',
    user_handle: 'sam_jony',
    user_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    text: 'I saw a bike slip here yesterday evening in the rain! High priority for sure.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  });

  insertComment.run({
    id: 'cm-2',
    issue_id: 'CC-2026-001',
    user_id: 'usr-admin',
    user_name: 'Ward 14 Officer (Eng. Ramesh)',
    user_handle: 'civic_ward14_admin',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'Noted. Cold-mix patch truck #4 has been dispatched for levelling today.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  });

  // Contacts
  const contacts = [
    {
      id: 'c1',
      name: 'Central Municipal Control Room',
      department: 'Emergency Civic Triage',
      category: 'Emergency',
      phone: '1913',
      whatsapp: '+919445190913',
      email: 'controlroom@civicconnect.gov.in',
      hours: '24/7 Toll-Free Helpline',
      address: 'Ripon Municipal Headquarters, Ground Floor',
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150',
      is_emergency: 1,
    },
    {
      id: 'c2',
      name: 'Er. Ramesh Kumar',
      department: 'Roads & Highways Division (Ward 14)',
      category: 'Roads',
      phone: '+91 94441 23451',
      whatsapp: '+919444123451',
      email: 'pwd.roads.ward14@civicconnect.gov.in',
      hours: 'Mon - Sat: 9:00 AM - 6:00 PM',
      address: 'PWD Zonal Depot, College Road',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      is_emergency: 0,
    },
    {
      id: 'c3',
      name: 'Sewage Jetting & Stormwater Dept',
      department: 'Water Supply & Sewerage Board',
      category: 'Drainage',
      phone: '1916',
      whatsapp: '+919445191916',
      email: 'waterdrainage@civicconnect.gov.in',
      hours: '24/7 Emergency Jetting Tankers',
      address: 'Metro Water Zonal Station 4',
      avatar: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150',
      is_emergency: 1,
    },
    {
      id: 'c4',
      name: 'TANGEDCO Street Lighting Control',
      department: 'Electricity & Lighting',
      category: 'Electrical',
      phone: '1912',
      whatsapp: '+919445191912',
      email: 'powerfaults@civicconnect.gov.in',
      hours: '24/7 Breakdown & Transformer Team',
      address: 'Substation Division, North Gate',
      avatar: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=150',
      is_emergency: 0,
    },
    {
      id: 'c5',
      name: 'Sanitation & Solid Waste Inspector',
      department: 'Public Health & Cleanliness',
      category: 'Sanitation',
      phone: '+91 94448 88990',
      whatsapp: '+919444888990',
      email: 'sanitation.ward14@civicconnect.gov.in',
      hours: 'Daily: 6:00 AM - 2:00 PM',
      address: 'Micro-Composting Yard, Market Road',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      is_emergency: 0,
    },
  ];

  for (const c of contacts) {
    insertContact.run(c);
  }

  console.log('✅ Seed data successfully inserted.');
}
