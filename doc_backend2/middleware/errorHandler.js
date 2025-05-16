const mongoose = require('mongoose');

const handleDatabaseError = (error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map(err => err.message);
    return {
      status: 400,
      message: 'Validation Error',
      errors
    };
  }

  if (error.code === 11000) {
    return {
      status: 400,
      message: 'Duplicate Error',
      error: 'This record already exists'
    };
  }

  return {
    status: 500,
    message: 'Database Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  };
};

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      status: 400,
      message: 'Invalid ID format'
    };
  }
  return null;
};

module.exports = {
  handleDatabaseError,
  validateObjectId
}; 