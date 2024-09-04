const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;
const telegramToken = '7376492807:AAH8_faU0KO8Jhb3h69K_YvlhDpphZ77_Rk';
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}`;

const wsServer = new WebSocket.Server({ noServer: true });
console.log('Путь к директории dist:', path.join(__dirname, '../client/client/dist'));
wsServer.on('connection', (ws) => {
    console.log('WebSocket клиент подключен');

    ws.on('message', (message) => {
        console.log('Получено сообщение:', message);
        ws.send(`Ответ сервера: ${message}`);
    });

    ws.on('close', () => {
        console.log('WebSocket клиент отключился');
    });

    ws.send('Добро пожаловать на сервер WebSocket!');
});

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    try {
        const update = req.body;

        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            await axios.post(`${telegramApiUrl}/sendMessage`, {
                chat_id: chatId,
                text: `Вы написали: ${text}`,
            }).catch(error => {
                console.error('Ошибка при отправке сообщения в Telegram:', error);
            });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.sendStatus(500);
    }
});

app.use(express.static(path.join(__dirname, '../client/client/dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/client/dist', 'index.html'));
});

const server = app.listen(port, () => {
    console.log(`Express сервер запущен на порту ${port}`);
});

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/websocket') {
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    }
});
