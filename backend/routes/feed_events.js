import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { listRecentActivity } from '../dao/feed_events.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const rows = await listRecentActivity(limit);
  res.json(rows);
}));

export default router;
