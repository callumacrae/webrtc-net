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
});