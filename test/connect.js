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
			.then((token) => peernet3.invite(token));

		peernet2.getToken()
			.then((token) => peernet3.invite(token));

		let connected = 0;

		peernet1.on('connect', () => {
			connected++;
			if (connected === 2) {
				finishTest();
			}
		});

		peernet2.on('connect', () => {
			connected++;
			if (connected === 2) {
				finishTest();
			}
		});

		function finishTest() {
			peernet1.directPeers.length.should.equal(1);
			peernet2.directPeers.length.should.equal(1);
			peernet3.directPeers.length.should.equal(2);
			done();
		}
	});
});