const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const View = require('../models/View');
const auth = require('../middleware/auth');

// Get comments for a row
router.get('/:viewId/:groupId/:rowId/comments', auth, async (req, res) => {
  try {
    const { viewId, groupId, rowId } = req.params;
    console.log('Fetching comments for:', { viewId, groupId, rowId });

    // Verify that the view, group, and row exist
    const view = await View.findById(viewId);
    console.log('Found view:', view ? 'yes' : 'no');
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    const group = view.table.groups.id(groupId);
    console.log('Found group:', group ? 'yes' : 'no');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const row = group.rows.id(rowId);
    console.log('Found row:', row ? 'yes' : 'no');
    if (!row) {
      return res.status(404).json({ message: 'Row not found' });
    }

    const comments = await Comment.find({ viewId, groupId, rowId })
      .populate('user', 'name email')
      .populate('likes', 'name email')
      .populate('replies.user', 'name email')
      .sort('-createdAt');
    
    console.log('Found comments:', comments.length);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// Create a comment
router.post('/:viewId/:groupId/:rowId/comments', auth, async (req, res) => {
  try {
    const { viewId, groupId, rowId } = req.params;

    // Verify that the view, group, and row exist
    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    const group = view.table.groups.id(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const row = group.rows.id(rowId);
    if (!row) {
      return res.status(404).json({ message: 'Row not found' });
    }

    const comment = new Comment({
      viewId,
      groupId,
      rowId,
      user: req.user.userId,
      content: req.body.content,
      attachments: req.body.attachments || []
    });

    await comment.save();
    
    // Populate user data before sending response
    await comment.populate('user', 'name email');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: error.message || 'Error creating comment' });
  }
});

// Like/unlike a comment
router.post('/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(req.user.userId);
    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like
      comment.likes.push(req.user.userId);
    }

    await comment.save();
    await comment.populate('likes', 'name email');
    
    res.json(comment);
  } catch (error) {
    console.error('Error updating comment like:', error);
    res.status(500).json({ message: 'Error updating comment like', error: error.message });
  }
});

// Add a reply to a comment
router.post('/comments/:commentId/replies', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({
      user: req.user.userId,
      content: req.body.content
    });

    await comment.save();
    await comment.populate('replies.user', 'name email');
    
    res.json(comment);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
});

// Delete a comment
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only allow comment owner to delete
    if (comment.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.remove();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
});

module.exports = router; 