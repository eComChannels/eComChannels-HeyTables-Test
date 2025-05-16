const { v4: uuidv4 } = require('uuid');

const DEFAULT_COLUMNS = [
  {
    type: 'item',
    title: 'Item',
    width: 300
  },
  {
    type: 'person',
    title: 'Person',
    width: 150
  },
  {
    type: 'text',
    title: 'Text',
    width: 150
  },
  {
    type: 'status',
    title: 'Status',
    width: 150,
    statuses: [
      {
        value: 'Working on it',
        color: '#fdab3d'
      },
      {
        value: 'Done',
        color: '#00c875'
      },
      {
        value: 'Stuck',
        color: '#e2445c'
      }
    ]
  },
  {
    type: 'date',
    title: 'Date',
    width: 150
  },
  {
    type: 'formula',
    title: 'Formula',
    width: 150
  }
];
const DEFAULT_SCHEMA_COLUMNS = [
  {
    type: 'item',
    title: 'Item',
    width: 300
  },
  {
    type: 'person',
    title: 'Person',
    width: 150
  },
  {
    type: 'text',
    title: 'Text',
    width: 150
  },
  {
    type: 'status',
    title: 'Status',
    width: 150,
    statuses: [
      {
        value: 'Working on it',
        color: '#fdab3d'
      },
      {
        value: 'Done',
        color: '#00c875'
      },
      {
        value: 'Stuck',
        color: '#e2445c'
      }
    ]
  },
  {
    type: 'date',
    title: 'Date',
    width: 150
  },
];

const DEFAULT_ROWS = [
  {
    title: 'New item',
    cells: DEFAULT_COLUMNS.map(col => {
      let defaultValue = '';
      
      // Set default values based on column type
      switch (col.type) {
        case 'item':
          defaultValue = 'New item';
          break;
        case 'status':
          defaultValue = '';
          break;
        case 'date':
          defaultValue = new Date().toISOString();
          break;
        case 'person':
          defaultValue = [];
          break;
        default:
          defaultValue = '';
      }

      return {
        value: defaultValue
      };
    })
  }
];

const DEFAULT_GROUPS = [
  {
    title: 'Group Title',
    rows: DEFAULT_ROWS
  }
];
const DEFAULT_VALUES = {
  item: title => title,  // Use provided title
  person: () => [],      // Empty array
  text: () => '',       // Empty string
  status: () => '',     // Empty string
  date: () => new Date().toISOString(),  // Current date
  formula: () => ''     // Empty string
};
module.exports = {
  DEFAULT_COLUMNS,
  DEFAULT_SCHEMA_COLUMNS,
  DEFAULT_ROWS,
  DEFAULT_GROUPS,
  DEFAULT_VALUES,
}; 