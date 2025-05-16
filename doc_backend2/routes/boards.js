const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const User = require('../models/User');
const auth = require('../middleware/auth');
const View = require('../models/View');
const { DEFAULT_GROUPS,  DEFAULT_SCHEMA_COLUMNS, DEFAULT_VALUES } = require('../constants/defaults');
const mongoose = require('mongoose');  // Add this import at the top
const nodemailer = require('nodemailer');

// Create a new board
router.post('/', auth, async (req, res) => {
  try {
    const { name, privacy, managing_type, description, type = 'table' } = req.body;
    const board = new Board({
      name,
      privacy,
      managing_type,
      description,
      type,
      userId: req.user.userId,
      url: Date.now().toString()
    });

    const savedBoard = await board.save();

    // Handle different board types
    if (type === 'table') {
      // First create column definitions with IDs
      const columnsWithIds = DEFAULT_SCHEMA_COLUMNS.map(col => ({
        _id: new mongoose.Types.ObjectId(),
        type: col.type,
        title: col.title,
        width: col.width,
        ...(col.statuses && { statuses: col.statuses })
      }));

      const mainView = new View({
        name: 'Main Table',
        type: 'table',
        board: savedBoard._id,
        isDefault: true,
        table: {
          columns: columnsWithIds,
          groups: DEFAULT_GROUPS.map(group => ({
            ...group,
            rows: group.rows.map(row => ({
              ...row,
              cells: columnsWithIds.map(col => ({
                columnId: col._id,
                value: DEFAULT_VALUES[col.type]('New item')  // Use default values
              }))
            }))
          }))
        }
      });
      
      const savedView = await mainView.save();
      savedBoard.views = [savedView._id];
      await savedBoard.save();
    } 
    else if (type === 'doc') {
      // TODO: Handle doc type board creation
      // Will implement later
    }
    else if (type === 'form') {
      // TODO: Handle form type board creation
      // Will implement later
    }

    res.status(201).json(savedBoard);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all boards for user
router.get('/', auth, async (req, res) => {
  try {
    // Find all boards where:
    // 1. User is the owner OR
    // 2. Board privacy is 'main' OR
    // 3. User is a member of the board
    const boards = await Board.find({
      $or: [
        { userId: req.user.userId },
        { privacy: 'main' },
        { 'members.userId': req.user.userId }
      ]
    }).sort({ created_at: -1 }); // Most recent first
    
    // Add isOwner and role fields to each board
    const boardsWithMeta = boards.map(board => {
      const isBoardOwner = board.userId === req.user.userId;
      const member = board.members.find(m => m.userId.toString() === req.user.userId);
      
      return {
        ...board.toObject(),
        isOwner: isBoardOwner,
        role: member ? member.role : (isBoardOwner ? 'owner' : 'viewer')
      };
    });
    
    res.json(boardsWithMeta);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single board by URL
router.get('/:url', auth, async (req, res) => {
  try {
    const board = await Board.findOne({ url: req.params.url });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access based on privacy setting
    const isMember = board.members.some(member => 
      member.userId.toString() === req.user.userId
    );
    console.log('isMember', isMember);
    console.log('board', board);
    console.log('req.user.userId', req.user.userId);

    if (board.privacy === 'private' && board.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (board.privacy === 'shareable' && 
        board.userId !== req.user.userId && 
        !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get user info of the board owner
    const userInfo = await User.findById(board.userId, 'email');
    if (!userInfo) {
      return res.status(404).json({ message: 'Board owner not found' });
    }

    res.json({
      ...board.toObject(),
      userInfo: {
        email: userInfo.email
      }
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update board
router.put('/:id', auth, async (req, res) => {
  try {
    // First check if the board exists and if the user is the owner
    const existingBoard = await Board.findById(req.params.id);
    if (!existingBoard) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only allow the board owner to update privacy settings
    if (req.body.privacy !== undefined && existingBoard.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Only the board owner can change privacy settings' });
    }

    const updateFields = {};
    
    // Only add fields to update if they exist in request body
    if (req.body.name !== undefined) {
      updateFields.name = req.body.name;
    }
    if (req.body.description !== undefined) {
      updateFields.description = req.body.description;
    }
    if (req.body.privacy !== undefined) {
      updateFields.privacy = req.body.privacy;
    }
    if (req.body.managing_type !== undefined) {
      updateFields.managing_type = req.body.managing_type;
    }
    
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id },
      updateFields,
      { new: true }
    );

    // Get user info
    const user = await User.findById(board.userId, 'email');

    res.json({
      ...board.toObject()
    });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete board
router.delete('/:id', auth, async (req, res) => {
  try {
    // First check if the board exists and if the user is the owner
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only allow the board owner to delete
    if (board.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Only the board owner can delete this board' });
    }

    // Delete all views associated with this board
    await View.deleteMany({ board: req.params.id });
    
    // Then delete the board
    await Board.findByIdAndDelete(req.params.id);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite users to board
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { emails, role = 'viewer' } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only board owner can invite users
    if (board.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Only board owner can invite users' });
    }

    // Board must be shareable to invite users
    if (board.privacy !== 'shareable') {
      return res.status(400).json({ message: 'Board must be shareable to invite users' });
    }

    // Process each email
    const invitePromises = emails.map(async (email) => {
      // Check if user is already a member
      const existingMember = board.members.find(member => 
        member.userId.toString() === req.user.userId
      );
      if (existingMember) {
        return { email, status: 'already_member' };
      }

      // Check if invite already exists
      const existingInvite = board.invites.find(invite => 
        invite.email === email && invite.status === 'pending'
      );
      if (existingInvite) {
        return { email, status: 'already_invited' };
      }

      // Add new invite
      board.invites.push({
        email,
        role,
        invitedAt: new Date(),
        status: 'pending'
      });

      // TODO: Send invitation email
      // For now, just log it
      console.log(`Invitation sent to ${email} for board ${board.name}`);

      return { email, status: 'invited' };
    });

    const inviteResults = await Promise.all(invitePromises);
    await board.save();

    res.json({ 
      message: 'Invitations processed',
      results: inviteResults
    });
  } catch (error) {
    console.error('Error inviting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept board invitation
router.post('/:id/accept-invite', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Find the invitation
    const userEmail = req.user.email;
    const inviteIndex = board.invites.findIndex(invite => 
      invite.email === userEmail && invite.status === 'pending'
    );

    if (inviteIndex === -1) {
      return res.status(404).json({ message: 'No pending invitation found' });
    }

    // Add user as member
    board.members.push({
      userId: req.user.userId,
      role: board.invites[inviteIndex].role,
      addedAt: new Date()
    });

    // Update invite status
    board.invites[inviteIndex].status = 'accepted';
    await board.save();

    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get board members and invites
router.get('/:id/members', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('members.userId', 'email name')
      .select('members invites');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only board owner can see pending invites
    const isOwner = board.userId === req.user.userId;
    const response = {
      members: board.members,
      invites: isOwner ? board.invites : board.invites.filter(invite => invite.email === req.user.email)
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching board members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 