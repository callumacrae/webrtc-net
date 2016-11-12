var RTCPeerConnection = webkitRTCPeerConnection;

function PeerNet(config) {
	this.directPeers = [];

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
				token = data.token;
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
						this.directPeers.push({ pc, channel });
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
			this.directPeers.push({ pc, channel });
			socket.close();
		};
	};
};
