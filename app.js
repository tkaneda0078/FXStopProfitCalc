import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
dotenv.config();

const app = express();
const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function getATRValue(symbol, interval) {
    const url = `https://www.alphavantage.co/query?function=ATR&symbol=${symbol}&interval=${interval}&time_period=14&apikey=${apiKey}`;

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
