const TradingPair = require('../models/TradingPair');
const Transaction = require('../models/Transaction');
const dexService = require('./dexService');

class BotService {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.tradingInterval = null;
  }

  async startBot() {
    if (this.isRunning) {
      return { status: 'Bot is already running' };
    }

    this.isRunning = true;
    this.startTime = new Date();
    this.startTradingCycle();

    return {
      status: 'Bot started successfully',
      startTime: this.startTime
    };
  }

  async stopBot() {
    if (!this.isRunning) {
      return { status: 'Bot is not running' };
    }

    this.isRunning = false;
    this.startTime = null;
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
    }

    return { status: 'Bot stopped successfully' };
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  async getMetrics() {
    const metrics = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalProfit: { $sum: '$profit' },
          successfulTrades: {
            $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] }
          }
        }
      }
    ]);

    return metrics[0] || {
      totalTrades: 0,
      totalProfit: 0,
      successfulTrades: 0
    };
  }

  startTradingCycle() {
    this.tradingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const pairs = await TradingPair.find({ isActive: true });
        for (const pair of pairs) {
          await this.checkArbitragePair(pair);
        }
      } catch (error) {
        console.error('Trading cycle error:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  async checkArbitragePair(pair) {
    try {
      const prices = await dexService.getPrices(pair.pairName);
      const opportunity = this.findArbitrageOpportunity(prices, pair.minSpread);
      
      if (opportunity) {
        await this.executeArbitrage(opportunity, pair);
      }
    } catch (error) {
      console.error(`Error checking pair ${pair.pairName}:`, error);
    }
  }

  findArbitrageOpportunity(prices, minSpread) {
    // Implement arbitrage opportunity detection logic
    return null;
  }

  async executeArbitrage(opportunity, pair) {
    // Implement arbitrage execution logic
  }
}

module.exports = new BotService(); 