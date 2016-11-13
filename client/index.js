var RTCPeerConnection = webkitRTCPeerConnection;

function PeerNet(config) {
	this.directPeers = [];
	this.receivedMessages = [];

	this.token = undefined;

	// Adds _event and _eventsCount properties
	EventEmitter.call(this);
}

PeerNet.prototype = Object.create(EventEmitter.prototype);

PeerNet.prototype.getToken = function getToken() {
	return new Promise((resolve) => {
		var pc, channel, token;

		var socket = new WebSocket('ws://localhost:9001');

		socket.onmessage = (e) => {
			var data = JSON.parse(e.data);

			if (data.type === 'token') {
				this.token = token = data.token;
				resolve(data.token);
			} else if (data.type === 'offer') {
				pc = new RTCPeerConnection(
					{ iceServers: [{ url: 'stun:stun.l.google.com:19302' }] }
				);

				pc.onicecandidate = (e) => {
					if (e.candidate) {
						socket.send(JSON.stringify({
							type: 'ice',
							to: data.from,
							sdp: e.candidate
						}));
					}
				};

				pc.onnegotiationneeded = () => {
					pc.createOffer()
						.then((desc) => pc.setLocalDescription(desc))
						.then(() => {
							socket.send(JSON.stringify({
								to: data.from,
								desc: pc.localDescription
							}));
						});
				};

				pc.ondatachannel = (e) => {
					channel = e.channel;
					channel.onopen = () => {
						this._addDirectPeer(pc, channel);
						socket.close();
						this.emit('connect');
					};
				};

				pc.setRemoteDescription(data.desc)
					.then(() => pc.createAnswer())
					.then((answer) => pc.setLocalDescription(answer))
					.then(() => {
						socket.send(JSON.stringify({
							type: 'answer',
							to: data.from,
							desc: pc.localDescription
						}));
					});
			} else if (data.type === 'ice') {
				pc.addIceCandidate(data.sdp);
			}
		};
	});
};


PeerNet.prototype.invite = function inviteToken(token) {
	var pc, channel;

	var socket = new WebSocket('ws://localhost:9001');

	if (!this.token) {
		this.token = Math.floor(Math.random() * 1e10);
	}

	socket.onmessage = function(e) {
		var data = JSON.parse(e.data);

		if (data.type === 'answer') {
			pc.setRemoteDescription(data.desc);
		} else if (data.type === 'ice') {
			pc.addIceCandidate(data.sdp);
		}
	};

	socket.onopen = () => {
		pc = new RTCPeerConnection(
			{ iceServers: [{ url: 'stun:stun.l.google.com:19302' }] }
		);

		pc.onicecandidate = function (e) {
			if (e.candidate) {
				socket.send(JSON.stringify({
					type: 'ice',
					to: token,
					sdp: e.candidate
				}));
			}
		};

		pc.onnegotiationneeded = function () {
			pc.createOffer()
				.then((desc) => pc.setLocalDescription(desc))
				.then(() => {
					socket.send(JSON.stringify({
						type: 'offer',
						to: token,
						desc: pc.localDescription
					}))
				});
		};

		channel = pc.createDataChannel('sendDataChannel');
		channel.binaryType = 'arraybuffer';
		channel.onopen = () => {
			this._addDirectPeer(pc, channel);
			socket.close();
		};
	};
};

PeerNet.prototype._addDirectPeer = function (pc, channel) {
	const peerObj = { pc, channel };
	this.directPeers.push(peerObj);

	channel.send(JSON.stringify({
		type: 'token',
		token: this.token
	}));

	channel.onmessage = (e) => {
		const data = JSON.parse(e.data);

		if (data.type === 'token') {
			peerObj.token = data.token;
			return;
		}

		// Ignore if it was already received from another peer
		const found = this.receivedMessages.find(({ id }) => id === data.id);
		if (found) {
			return;
		}
		this.receivedMessages.push(data);

		data.hops++;

		if (data.type === 'message') {
			this.emit('message', data.data, data);

			data.path.push(this.token);

			// Find all channels that aren't the one we just received from and send
			this.directPeers
				.filter((peer) => peer.pc !== pc)
				.forEach((peer) => {
					peer.channel.send(JSON.stringify(data));
				});
		}

		if (data.type === 'insecureDm') {
			if (data.path[0] === this.token) {
				this.emit('insecureDm', data.data, data);
			} else {
				const nextToken = data.path[data.path.indexOf(this.token) - 1];
				const nextPeer = this.directPeers.find(({ token }) => token === nextToken);
				nextPeer.channel.send(JSON.stringify(data));
			}
		}
	};
};

PeerNet.prototype.broadcast = function sendMessage(data) {
	this.directPeers.forEach((peer) => {
		peer.channel.send(JSON.stringify({
			id: Math.floor(Math.random() * 1e9).toString(), // @todo: better ID
			type: 'message',
			data,
			hops: 0,
			origin: this.token,
			path: [this.token],
			time: Date.now()
		}));
	});
};

PeerNet.prototype.insecureDm = function sendInsecureDm(toPath, data) {
	const toToken = toPath[toPath.length - 1];
	const toPeer = this.directPeers.find(({ token }) => token === toToken);

	toPeer.channel.send(JSON.stringify({
		id: Math.floor(Math.random() * 1e9).toString(), // @todo: better ID
		type: 'insecureDm',
		data,
		hops: 0,
		origin: this.token,
		path: toPath, // Inverse of broadcast
		time: Date.now()
	}));
};
