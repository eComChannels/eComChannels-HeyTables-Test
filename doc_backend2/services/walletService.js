const { Connection, Keypair, PublicKey } = require('@solana/web3.js');

class WalletService {
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL);
    this.wallet = null;
  }

  async initialize() {
    try {
      // Initialize wallet from private key
      const privateKey = process.env.WALLET_PRIVATE_KEY;
      if (privateKey) {
        this.wallet = Keypair.fromSecretKey(
          Buffer.from(JSON.parse(privateKey))
        );
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async signTransaction(transaction) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      transaction.sign(this.wallet);
      return transaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }
}

module.exports = new WalletService(); 