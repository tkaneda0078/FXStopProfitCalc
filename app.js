import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
dotenv.config();

const app = express();
const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
const baseUrl = 'https://www.alphavantage.co/query';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

app.use(express.json());
app.use(express.static('public'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.post('/calculate', async (req, res) => {
    const { entryPrice, interval, atrMultiplier, positionType } = req.body;
    const atrValue = await getATRValue('USDJPY', interval);

    let stopLoss, takeProfit;
    if (positionType === 'buy') {
        stopLoss = (entryPrice - atrValue * atrMultiplier).toFixed(3);
        takeProfit = (entryPrice + atrValue * atrMultiplier).toFixed(3);
    } else {
        stopLoss = (entryPrice + atrValue * atrMultiplier).toFixed(3);
        takeProfit = (entryPrice - atrValue * atrMultiplier).toFixed(3);
    }

    res.json({ stopLoss, takeProfit, atrValue, atrPeriod: '14' });
});

app.post('/current-exchange-rate', async (req, res) => {
    const { fromCurrency, toCurrency } = req.body;
    const url = `${baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const exchangeRate = extractExchangeRate(data);
        res.json({ exchangeRate });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        res.status(500).send('Unable to fetch exchange rate');
    }
});

async function getATRValue(symbol, interval) {
    const url = `${baseUrl}?function=ATR&symbol=${symbol}&interval=${interval}&time_period=14&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const atrValue = extractATRValue(data);
        return atrValue;
    } catch (error) {
        console.error('Error:', error);
        return 0;
    }
}

function extractATRValue(data) {
    const atrData = data["Technical Analysis: ATR"];
    if (atrData) {
        const lastRefreshed = Object.keys(atrData)[0];
        const atrValue = atrData[lastRefreshed]["ATR"];
        return parseFloat(atrValue);
    } else {
        console.error('ATR value not found in response');
        return 0;
    }
}

/**
 * Alpha Vantage APIのレスポンスデータから為替レートを抽出する
 * 価格を小数点以下第3位までの数値にフォーマットする
 *
 * @param {object} data - Alpha Vantage APIからのレスポンスデータ
 * @returns {string|null} 抽出された為替レート。データが存在しない場合はnullを返す
 */
function extractExchangeRate(data) {
    if (data && data["Realtime Currency Exchange Rate"]) {
        const exchangeRateData = data["Realtime Currency Exchange Rate"];
        const exchangeRate = exchangeRateData["5. Exchange Rate"];
        return parseFloat(parseFloat(exchangeRate).toFixed(3));
    } else {
        console.error('Exchange rate data not found in response');
        return null;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});