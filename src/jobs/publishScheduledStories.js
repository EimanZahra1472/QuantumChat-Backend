import Story from '../models/Story.js';
import { sendStoryMentionMessages } from '../services/storyMentionMessages.js';

/**
 * Publish scheduled stories whose publishAt has arrived.
 * Emits story:new for each newly published story.
 */
export async function publishDueStories(io) {
  const now = new Date();
  const due = await Story.find({
    status: 'scheduled',
    publishAt: { $lte: now },
  })
    .limit(50)
    .populate('user', 'username avatarPath')
    .populate('mentions.user', 'username avatarPath');

  if (!due.length) return 0;

  let published = 0;
  for (const story of due) {
    const ttl = story.ttlMs || Story.ttlMs;
    story.status = 'published';
    story.expiresAt = new Date(now.getTime() + ttl);
    if (!story.publishAt) story.publishAt = now;
    await story.save();
    published += 1;

    const owner = story.user;
    const mentions = Array.isArray(story.mentions) ? story.mentions : [];

    if (io) {
      io.emit('story:new', {
        ...story.toPublicJSON(),
        mentions: mentions
          .filter((m) => m.visibility === 'public')
          .map((m) => ({
            user: {
              id: m.user?._id || m.user,
              username: m.user?.username || 'User',
              hasAvatar: Boolean(m.user?.avatarPath),
            },
            visibility: m.visibility,
          })),
        user: {
          id: owner?._id || story.user,
          username: owner?.username || 'User',
          hasAvatar: Boolean(owner?.avatarPath),
        },
      });
    }

    await sendStoryMentionMessages(io, story);
  }

  return published;
}

export async function runStoryPublishJobs(io) {
  try {
    return await publishDueStories(io);
  } catch (err) {
    console.error('publishDueStories failed:', err.message);
    return 0;
  }
}