const ws = require('ws');
const wss = new ws.Server({ port: process.env.PORT || 9001 });

const openConnections = {};

wss.on('connection', (socket) => {
	// @todo: check if not already taken
	const token = Math.floor(Math.random() * 1e10);
	socket.send(JSON.stringify({ type: 'token', token }));

	openConnections[token] = socket;

	socket.on('message', (rawData) => {
		const data = JSON.parse(rawData);

		if (data.to && openConnections[data.to]) {
			data.from = token;
			openConnections[data.to].send(JSON.stringify(data));
		} else {
			socket.send(JSON.stringify({
				type: 'error',
				error: `Socket ${token} not found`
			}));
		}
	});

	socket.on('close', () => {
		delete openConnections[token];
	});
});