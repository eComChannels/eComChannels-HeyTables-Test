import React, { useState } from 'react';
import { FaRegComment } from 'react-icons/fa';
import CommentSection from './CommentSection';

const CommentButton = ({ viewId, groupId, rowId }) => {
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsCommentOpen(true)}
        className="p-1 text-skin-secondary hover:text-skin-primary hover:bg-skin-hover rounded-sm transition-colors"
        title="Add comment"
      >
        <FaRegComment className="w-4 h-4" />
      </button>

      <CommentSection
        viewId={viewId}
        groupId={groupId}
        rowId={rowId}
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
      />
    </>
  );
};

export default CommentButton; 