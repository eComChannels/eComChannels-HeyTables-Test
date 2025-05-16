import { FaCalculator } from 'react-icons/fa';

export const COLUMN_TYPES = [
  {
    value: 'item',
    label: 'Item',
    description: 'Any text or title',
    icon: '📝',
    width: 'w-[300px]',
    align: 'text-left',
  },
  {
    value: 'text',
    label: 'Text',
    description: 'Any text or title',
    icon: '📝',
    width: 'w-[150px]',
    align: 'text-center'
  },
  {
    value: 'person',
    label: 'Person',
    description: 'Assign team members',
    icon: '👤',
    width: 'w-[150px]',
    align: 'text-center'
  },
  {
    value: 'status',
    label: 'Status',
    description: 'Track status and progress',
    icon: '📊',
    width: 'w-[150px]',
    align: 'text-center'
  },
  {
    value: 'date',
    label: 'Date',
    description: 'Add due dates and reminders',
    icon: '📅',
    width: 'w-[150px]',
    align: 'text-center'
  },
  {
    value: 'formula',
    label: 'Formula',
    description: 'Calculate values using other columns',
    icon: <FaCalculator className="w-4 h-4 text-[#00a0a0]" />,
    width: 150
  }
];

export const STATUS_OPTIONS = [
  'Done',
  'Stuck',
  'Working on it'
]; 