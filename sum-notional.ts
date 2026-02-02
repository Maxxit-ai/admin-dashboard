import data from './sample-data.json';

const trades = data.data.trades;

let totalNotional = 0;
let totalTradeNotional = 0;

for (const trade of trades) {
    totalNotional += Number(trade.notional) / 1e6;
    totalTradeNotional += Number(trade.tradeNotional) / 1e6;
}

console.log(`Total Notional: $${totalNotional.toFixed(2)}`);
console.log(`Total Trade Notional: $${totalTradeNotional.toFixed(2)}`);
console.log(`Number of trades: ${trades.length}`);
