function calculate() {
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const interval = document.getElementById('interval').value;
    const atrMultiplier = parseFloat(document.getElementById('atrMultiplier').value);
    const entryTime = document.getElementById('entryTime').value;
    const positionType = document.getElementById('positionType').value;


    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryPrice, interval, atrMultiplier, entryTime }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('output').innerHTML = '損切りライン: ' + data.stopLoss + '<br>利確ライン: ' + data.takeProfit + '<br>使用したATR値: ' + data.atrValue;
    })
    .catch(error => console.error('Error:', error));
}
