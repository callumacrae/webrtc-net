describe('Peernet simple connection', () => {
	it('should connect', (done) => {
		const webRTCnet1 = new WebRTCNet();
		const webRTCnet2 = new WebRTCNet();

		webRTCnet1.getToken()
			.then((token) => {
				should(token).not.be.null();
				webRTCnet2.invite(token);
			});

		webRTCnet1.on('connect', () => {
			webRTCnet1.directPeers.length.should.equal(1);
			webRTCnet2.directPeers.length.should.equal(1);
			done();
		});
	});

	it('should connect twice!', (done) => {
		const webRTCnet1 = new WebRTCNet();
		const webRTCnet2 = new WebRTCNet();
		const webRTCnet3 = new WebRTCNet();

		webRTCnet1.getToken()
			.then((token) => webRTCnet2.invite(token));

		webRTCnet3.getToken()
			.then((token) => webRTCnet2.invite(token));

		let connected = 0;

		webRTCnet1.on('connect', () => {
			connected++;
			if (connected === 2) {
				finishTest();
			}
		});

		webRTCnet3.on('connect', () => {
			connected++;
			if (connected === 2) {
				finishTest();
			}
		});

		function finishTest() {
			webRTCnet1.directPeers.length.should.equal(1);
			webRTCnet2.directPeers.length.should.equal(2);
			webRTCnet3.directPeers.length.should.equal(1);
			done();
		}
	});

	it('should broadcast message', (done) => {
		const webRTCnet1 = new WebRTCNet();
		const webRTCnet2 = new WebRTCNet();

		webRTCnet1.getToken()
			.then((token) => webRTCnet2.invite(token));

		webRTCnet1.on('connect', () => {
			webRTCnet1.broadcast('hello world');
		});

		webRTCnet2.on('message', (msg, e) => {
			msg.should.equal('hello world');
			e.data.should.equal('hello world');
			done();
		});
	});

	it('should broadcast non-string message', (done) => {
		const webRTCnet1 = new WebRTCNet();
		const webRTCnet2 = new WebRTCNet();

		webRTCnet1.getToken()
			.then((token) => webRTCnet2.invite(token));

		webRTCnet1.on('connect', () => {
			webRTCnet1.broadcast([1, 2, 3]);
		});

		webRTCnet2.on('message', (msg, e) => {
			msg.should.eql([1, 2, 3]);
			e.data.should.equal(msg);
			done();
		});
	});

	it('should broadcast data through multiple peers', (done) => {
		const webRTCnet1 = new WebRTCNet();
		const webRTCnet2 = new WebRTCNet();
		const webRTCnet3 = new WebRTCNet();

		webRTCnet1.getToken()
			.then((token) => webRTCnet2.invite(token));

		webRTCnet3.getToken()
			.then((token) => webRTCnet2.invite(token));

		let connected = 0;

		webRTCnet1.on('connect', () => {
			connected++;
			if (connected === 2) {
				webRTCnet1.broadcast([1, 2, 4]);
			}
		});

		webRTCnet3.on('connect', () => {
			connected++;
			if (connected === 2) {
				webRTCnet1.broadcast([1, 2, 4]);
			}
		});

		let peer2Received = false;

		webRTCnet2.on('message', (msg, e) => {
			peer2Received = true;
			msg.should.eql([1, 2, 4]);
			e.data.should.equal(msg);
			e.hops.should.equal(1);
			e.path.length.should.equal(1);
			e.path[0].should.be.a.Number();
		});

		webRTCnet3.on('message', (msg, e) => {
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

	it('should support insecure DMing', (done) => {
		const webRTCnet1 = new WebRTCNet();
		const webRTCnet2 = new WebRTCNet();
		const webRTCnet3 = new WebRTCNet();

		webRTCnet1.getToken()
			.then((token) => webRTCnet2.invite(token));

		webRTCnet3.getToken()
			.then((token) => webRTCnet2.invite(token));

		let connected = 0;

		webRTCnet1.on('connect', () => {
			connected++;
			if (connected === 2) {
				webRTCnet1.broadcast('test');
			}
		});

		webRTCnet3.on('connect', () => {
			connected++;
			if (connected === 2) {
				webRTCnet1.broadcast('test');
			}
		});

		webRTCnet3.on('message', (msg, e) => {
			// Reply using insecure DM
			webRTCnet3.insecureDm(e.path, { hello: 'peer' })
		});

		// if webRTCnet2 emits anything, error
		webRTCnet2.on('insecureDm', () => {
			should.fail('Insecure DM received on peer 2: wrong!');
		});

		webRTCnet1.on('insecureDm', (msg, e) => {
			msg.should.eql({ hello: 'peer' });
			e.data.should.equal(msg);
			e.hops.should.equal(2);
			e.path.length.should.equal(2);

			e.path[0].should.be.a.Number();
			e.path[1].should.be.a.Number();

			e.origin.should.be.a.Number();

			done();
		});
	});
});