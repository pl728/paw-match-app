import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import {
  getAllConversations,
  createConversation,
  getMessagesByConversationId,
  createMessage,
  getUnreadCount,
  markMessagesAsRead
} from '../dao/conversations.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async function (req, res) {
  const conversations = await getAllConversations(req.userId, req.userRole);
  res.json(conversations);
}));

router.get('/unread-count', requireAuth, asyncHandler(async function (req, res) {
  const count = await getUnreadCount(req.userId);
  res.json({ count });
}));

router.post('/', requireAuth, asyncHandler(async function (req, res) {
  const adopterUserId = req.body.adopter_user_id || req.userId;
  const shelterId = req.body.shelter_id;
  const petId = req.body.pet_id || null;

  if (!shelterId) {
    return res.status(400).json({ error: 'shelter_id is required' });
  }

  const conversation = await createConversation({
    adopter_user_id: adopterUserId,
    shelter_id: shelterId,
    pet_id: petId
  });

  res.status(201).json(conversation);
}));

router.get('/:id/messages', requireAuth, asyncHandler(async function (req, res) {
  const messages = await getMessagesByConversationId(req.params.id);
  res.json(messages);
}));

router.post('/:id/messages', requireAuth, asyncHandler(async function (req, res) {
  const body = req.body.body;

  if (!body) {
    return res.status(400).json({ error: 'body is required' });
  }

  const message = await createMessage({
    conversation_id: req.params.id,
    sender_user_id: req.userId,
    body: body
  });

  res.status(201).json(message);
}));

router.post('/:id/mark-read', requireAuth, asyncHandler(async function (req, res) {
  await markMessagesAsRead(req.userId, req.params.id);
  res.json({ success: true });
}));

export default router;