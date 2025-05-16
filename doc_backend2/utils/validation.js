const validateTradingPair = (pair) => {
  const errors = [];

  if (!pair.pair_name) {
    errors.push('Trading pair name is required');
  }

  if (typeof pair.min_spread !== 'number' || pair.min_spread < 0) {
    errors.push('Minimum spread must be a positive number');
  }

  if (typeof pair.max_trade_size !== 'number' || pair.max_trade_size <= 0) {
    errors.push('Maximum trade size must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBotSettings = (settings) => {
  const errors = [];

  if (settings.minProfitThreshold !== undefined) {
    if (typeof settings.minProfitThreshold !== 'number' || settings.minProfitThreshold < 0) {
      errors.push('Minimum profit threshold must be a positive number');
    }
  }

  if (settings.maxSlippage !== undefined) {
    if (typeof settings.maxSlippage !== 'number' || settings.maxSlippage < 0 || settings.maxSlippage > 100) {
      errors.push('Maximum slippage must be a number between 0 and 100');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

exports.validateSwapInput = (input) => {
  const { walletId, fromToken, toToken, amount, dex } = input;

  if (!walletId) return 'Wallet ID is required';
  if (!fromToken) return 'From token is required';
  if (!toToken) return 'To token is required';
  if (!amount || amount <= 0) return 'Valid amount is required';
  if (!dex || !['raydium', 'orca'].includes(dex)) return 'Valid DEX is required';

  return null;
};

module.exports = {
  validateTradingPair,
  validateBotSettings,
  validateSwapInput
}; 