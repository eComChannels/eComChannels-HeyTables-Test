import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletConnect = () => {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (connected && publicKey) {
      // Fetch balance
      fetchBalance();
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    // Implementation for fetching balance
  };

  return (
    <div className="flex items-center space-x-4">
      {connected && balance && (
        <div className="bg-gray-100 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-500">Balance:</span>
          <span className="ml-2 font-medium">{balance} SOL</span>
        </div>
      )}
      <WalletMultiButton />
    </div>
  );
};

export default WalletConnect; 