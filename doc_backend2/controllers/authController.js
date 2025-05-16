const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Board = require('../models/Board');

const authController = {
  async signup(req, res) {
    try {
      const { email, password, name } = req.body;
      
      // Check if user exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create user with name
      const user = new User({ email, password, name: name || email.split('@')[0] });
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Find and accept all pending invitations for this user
      const boards = await Board.find({ 'invites.email': email });
      for (const board of boards) {
        const invite = board.invites.find(inv => inv.email === email);
        if (invite) {
          // Add user as member
          board.members.push({
            userId: user._id,
            role: invite.role,
            addedAt: new Date()
          });
          // Remove the invitation
          board.invites = board.invites.filter(inv => inv.email !== email);
          await board.save();
        }
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController; 