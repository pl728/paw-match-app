import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { listFeedEvents } from '../dao/feed_events.js';

const router = express.Router();

router.get('/', asyncHandler(async function (req, res) {
    const limit = Number(req.query.limit) || 50;

    const events = await listFeedEvents(limit);
    res.json(events);
}));

export default router;
