import { FaLock, FaShare } from 'react-icons/fa';

export const PRIVACY_TYPES = [
  { 
    value: 'main', 
    label: 'Main', 
    description: 'Visible to everyone in your account' 
  },
  { 
    value: 'private', 
    label: 'Private', 
    icon: FaLock 
  },
  { 
    value: 'shareable', 
    label: 'Shareable', 
    icon: FaShare 
  }
]; 