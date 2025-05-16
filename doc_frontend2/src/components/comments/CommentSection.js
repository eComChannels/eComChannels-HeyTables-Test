import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../services/api';
import { FaRegSmile, FaPaperclip, FaAt, FaTimes, FaRegThumbsUp, FaThumbsUp, FaFile, FaImage, FaVideo, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import EmojiPicker from 'emoji-picker-react';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../../constants/fileTypes';
import ReactDOM from 'react-dom';

const CommentSection = ({ viewId, groupId, rowId, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [viewId, groupId, rowId, isOpen]);

  // Reset files and comment when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setNewComment('');
      setShowEmojiPicker(false);
    }
  }, [isOpen]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/items/${viewId}/${groupId}/${rowId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = selectedFiles.filter(file => {
      // Check if the file type is in our accepted types
      const isValidType = ACCEPTED_FILE_TYPES.all.includes(file.type);
      if (!isValidType) {
        toast.error(`File type ${file.type || 'unknown'} is not supported.`);
        return false;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 10MB size limit.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length !== selectedFiles.length) {
      toast.info(`${selectedFiles.length - validFiles.length} file(s) were not added due to unsupported format or size limits.`);
    }
    
    const newFiles = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
          ? 'video' 
          : 'file',
      name: file.name,
      size: file.size
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    
    try {
      const uploadPromises = files.map(async fileObj => {
        const formData = new FormData();
        formData.append('file', fileObj.file);
        
        try {
          const response = await axios.post('/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          return {
            type: fileObj.type,
            url: response.data.url,
            name: fileObj.name,
            size: fileObj.size
          };
        } catch (error) {
          // Handle individual file upload errors
          const errorMsg = error.response?.data?.error || `Failed to upload ${fileObj.name}`;
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      });
      
      // Use Promise.allSettled to continue even if some files fail
      const results = await Promise.allSettled(uploadPromises);
      
      // Filter only successful uploads
      const successfulUploads = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      // Show warning if some files failed
      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount > 0) {
        toast.warning(`${failedCount} file(s) could not be uploaded. Your comment will be posted with the successful uploads.`);
      }
      
      return successfulUploads;
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorMsg = error.response?.data?.error || 'Failed to upload files';
      toast.error(errorMsg);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Require either text or files
    if (!newComment.trim() && files.length === 0) return;

    try {
      setIsUploading(true);
      let attachments = [];
      
      if (files.length > 0) {
        try {
          attachments = await uploadFiles();
          
          // If all uploads failed and there's no comment text, stop
          if (attachments.length === 0 && !newComment.trim()) {
            setIsUploading(false);
            return;
          }
        } catch (error) {
          // If uploads failed but we have comment text, continue
          // Otherwise, stop submission
          if (!newComment.trim()) {
            setIsUploading(false);
            return;
          }
        }
      }
      
      // Send the comment with any successful attachments
      const response = await axios.post(`/items/${viewId}/${groupId}/${rowId}/comments`, {
        content: newComment || ' ', // Ensure at least empty content
        attachments
      });
      
      // Add the new comment to the list
      setComments([response.data, ...comments]);
      setNewComment('');
      setFiles([]);
    } catch (error) {
      console.error('Error posting comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to post comment';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (commentId) => {
    try {
      await axios.post(`/items/comments/${commentId}/like`);
      fetchComments(); // Refresh comments to get updated likes
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewComment(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const getFileIcon = (type) => {
    if (type === 'image') return <FaImage className="text-green-500" />;
    if (type === 'video') return <FaVideo className="text-blue-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  const commentSectionContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex:'9999' }}>
      <div className="bg-skin-primary w-[500px] max-h-[80vh] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="text-lg font-medium text-skin-primary">Comment</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-skin-hover rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5 text-skin-secondary hover:text-skin-primary" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-skin-secondary">Loading comments...</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {comment.user?.name ? comment.user.name.charAt(0) : comment.user?.email?.charAt(0) || '?'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-skin-primary">
                      {comment.user?.name || comment.user?.email || 'Anonymous'}
                    </span>
                    <span className="text-xs text-skin-secondary">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-skin-primary mt-1">{comment.content}</p>
                  
                  {/* Comment Attachments */}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comment.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center p-2 bg-skin-hover rounded">
                          <div className="mr-2">
                            {getFileIcon(attachment.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-skin-primary truncate">{attachment.name}</p>
                            {attachment.size && (
                              <p className="text-xs text-skin-secondary">{formatFileSize(attachment.size)}</p>
                            )}
                          </div>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 ml-2 text-skin-secondary hover:text-skin-primary"
                            download
                          >
                            {attachment.type === 'image' ? (
                              <span>View</span>
                            ) : (
                              <FaDownload className="w-4 h-4" />
                            )}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 flex space-x-4">
                    <button
                      onClick={() => handleLike(comment._id)}
                      className="text-xs text-skin-secondary hover:text-skin-primary flex items-center gap-1"
                    >
                      {comment.likes?.some(like => like.userId === user?.userId) ? (
                        <FaThumbsUp className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FaRegThumbsUp className="w-4 h-4" />
                      )}
                      {comment.likes?.length > 0 && (
                        <span>{comment.likes.length}</span>
                      )}
                    </button>
                    <button className="text-xs text-skin-secondary hover:text-skin-primary">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-[var(--border-color)] p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment and mention others with @"
                className="w-full p-3 border border-[var(--border-color)] rounded-lg bg-skin-primary text-skin-primary resize-none"
                rows="3"
              />
              <div className="absolute bottom-3 left-3 flex space-x-2 text-skin-secondary">
                <button 
                  type="button" 
                  className="hover:text-skin-primary"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <FaRegSmile />
                </button>
                <button type="button" className="hover:text-skin-primary">
                  <FaAt />
                </button>
                <button 
                  type="button" 
                  className="hover:text-skin-primary group relative"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaPaperclip />
                  {/* <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <p className="font-bold mb-1">Accepted file types:</p>
                    <p>Images (.jpg, .png, .gif, etc.)</p>
                    <p>Videos (.mp4, .webm, etc.)</p>
                    <p>Documents (.pdf, .doc, .txt, etc.)</p>
                    <p className="mt-1">Max file size: 10MB</p>
                  </div> */}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept={ACCEPTED_FILE_TYPES.all}
                />
              </div>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>

            {/* File Preview Area */}
            {files.length > 0 && (
              <div className="mt-2 space-y-2 max-h-[150px] overflow-y-auto p-2 border border-[var(--border-color)] rounded-lg">
                {files.map((fileObj, index) => (
                  <div key={index} className="flex items-center p-2 bg-skin-hover rounded group">
                    <div className="mr-2">
                      {getFileIcon(fileObj.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {fileObj.preview ? (
                        <div className="relative w-12 h-12 mr-2">
                          <img 
                            src={fileObj.preview} 
                            alt={fileObj.name} 
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ) : null}
                      <p className="text-sm text-skin-primary truncate">{fileObj.name}</p>
                      <p className="text-xs text-skin-secondary">{formatFileSize(fileObj.size)}</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={(!newComment.trim() && files.length === 0) || isUploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the component at the top layer of the DOM
  return ReactDOM.createPortal(
    commentSectionContent,
    document.body
  );
};

export default CommentSection; 