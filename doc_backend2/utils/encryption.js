const crypto = require('crypto');

// Use a consistent key length for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

function decrypt(text) {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

function decryptPrivateKey(encryptedPrivateKey) {
  try {
    if (!encryptedPrivateKey) {
      throw new Error('No private key provided');
    }
    console.log('Attempting to decrypt private key:', encryptedPrivateKey);
    const decrypted = decrypt(encryptedPrivateKey);
    console.log('Successfully decrypted private key');
    return decrypted;
  } catch (error) {
    console.error('Private key decryption error:', error);
    throw new Error('Failed to decrypt private key');
  }
}

module.exports = {
  encrypt,
  decrypt,
  decryptPrivateKey
}; 