describe('Peernet simple connection', () => {
	it('should connect', (done) => {
		const peernet1 = new PeerNet();
		const peernet2 = new PeerNet();

		peernet1.getToken()
			.then((token) => {
				should(token).not.be.null();
				peernet2.invite(token);
			});

		peernet1.on('connect', () => {
			peernet1.directPeers.length.should.equal(1);
			peernet2.directPeers.length.should.equal(1);
			done();
		});
	});

	it('should connect twice!', (done) => {
		const peernet1 = new PeerNet();
		const peernet2 = new PeerNet();
		const peernet3 = new PeerNet();

		peernet1.getToken()
			.then((token) => peernet2.invite(token));

		peernet3.getToken()
			.then((token) => peernet2.invite(token));

		let connected = 0;

		peernet1.on('connect', () => {
			connected++;
			if (connected === 2) {
				finishTest();
			}
		});

		peernet3.on('connect', () => {
			connected++;
			if (connected === 2) {
				finishTest();
			}
		});

		function finishTest() {
			peernet1.directPeers.length.should.equal(1);
			peernet2.directPeers.length.should.equal(2);
			peernet3.directPeers.length.should.equal(1);
			done();
		}
	});

	it('should broadcast message', (done) => {
		const peernet1 = new PeerNet();
		const peernet2 = new PeerNet();

		peernet1.getToken()
			.then((token) => peernet2.invite(token));

		peernet1.on('connect', () => {
			peernet1.broadcast('hello world');
		});

		peernet2.on('message', (msg, e) => {
			msg.should.equal('hello world');
			e.data.should.equal('hello world');
			done();
		});
	});

	it('should broadcast non-string message', (done) => {
		const peernet1 = new PeerNet();
		const peernet2 = new PeerNet();

		peernet1.getToken()
			.then((token) => peernet2.invite(token));

		peernet1.on('connect', () => {
			peernet1.broadcast([1, 2, 3]);
		});

		peernet2.on('message', (msg, e) => {
			msg.should.eql([1, 2, 3]);
			e.data.should.equal(msg);
			done();
		});
	});

	it('should broadcast data through multiple peers', (done) => {
		const peernet1 = new PeerNet();
		const peernet2 = new PeerNet();
		const peernet3 = new PeerNet();

		peernet1.getToken()
			.then((token) => peernet2.invite(token));

		peernet3.getToken()
			.then((token) => peernet2.invite(token));

		let connected = 0;

		peernet1.on('connect', () => {
			connected++;
			if (connected === 2) {
				peernet1.broadcast('omg');
			}
		});

		peernet3.on('connect', () => {
			connected++;
			if (connected === 2) {
				peernet1.broadcast([1, 2, 4]);
			}
		});

		let peer2Received = false;

		peernet2.on('message', (msg, e) => {
			peer2Received = true;
			msg.should.eql([1, 2, 4]);
			e.data.should.equal(msg);
			e.hops.should.equal(1);
			e.path.length.should.equal(1);
			e.path[0].should.be.a.Number();
		});

		peernet3.on('message', (msg, e) => {
			peer2Received.should.equal(true);
			msg.should.eql([1, 2, 4]);
			e.data.should.equal(msg);
			e.hops.should.equal(2);
			e.path.length.should.equal(2);

			e.path[0].should.be.a.Number();
			e.path[1].should.be.a.Number();

			done();
		});
	});
});