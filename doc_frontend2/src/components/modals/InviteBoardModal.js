import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from '../../services/api';
import emailjs from '@emailjs/browser';
import { useSelector } from 'react-redux';

function InviteBoardModal({ board, onClose }) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const sendInvitationEmail = async (email, inviteData) => {
    try {
      const templateParams = {
        to_email: email,
        from_name: user?.email || 'Board Owner',
        board_name: board.name,
        board_url: `${window.location.origin}/board/${board.url}`,
        role: role,
        message: `You have been invited to collaborate on the board "${board.name}" as a ${role}.`
      };

      await emailjs.send(
        'service_59yfqcv', // Replace with your EmailJS service ID
        'template_1y7xe9q', // Replace with your EmailJS template ID
        templateParams,
        'oH5ARf4lQl2QBOc0Z' // Replace with your EmailJS public key
      );

      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emailList = emails.split(',').map(email => email.trim());
    const invalidEmails = emailList.filter(email => !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(`/boards/${board._id}/invite`, {
        emails: emailList,
        role
      });

      // Send invitation emails
      const emailPromises = response.data.results
        .filter(r => r.status === 'invited')
        .map(r => sendInvitationEmail(r.email, r));

      await Promise.all(emailPromises);

      // Show results
      const { results } = response.data;
      const invited = results.filter(r => r.status === 'invited').length;
      const alreadyInvited = results.filter(r => r.status === 'already_invited').length;
      const alreadyMember = results.filter(r => r.status === 'already_member').length;

      let message = [];
      if (invited > 0) message.push(`${invited} new invitation(s) sent`);
      if (alreadyInvited > 0) message.push(`${alreadyInvited} already invited`);
      if (alreadyMember > 0) message.push(`${alreadyMember} already members`);

      toast.success(message.join(', '));
      onClose();
    } catch (error) {
      console.error('Error inviting users:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitations');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-skin-primary rounded-lg w-[500px]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl text-skin-primary font-medium">Invite to board</h2>
          <button onClick={onClose} className="text-skin-secondary hover:text-skin-primary">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-skin-secondary mb-2">
              Email addresses
              <span className="text-xs ml-2">(separate multiple emails with commas)</span>
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="email@example.com, another@example.com"
              className="w-full bg-skin-main text-skin-primary p-3 rounded-lg resize-none min-h-[80px] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[#0073EA]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-skin-secondary mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-skin-main text-skin-primary p-3 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[#0073EA]"
            >
              <option value="viewer">Viewer (can view only)</option>
              <option value="editor">Editor (can edit)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-skin-secondary hover:text-skin-primary hover:bg-skin-hover rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0073EA] hover:bg-[#0060c2] text-white rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteBoardModal; 