# Peernet

WebRTC powered network using a gossip algorithm to propagate messages.

WIP. Very WIP.

Recommended reading: http://medianetlab.ee.ucla.edu/papers/chapter_P2P_hpark.pdf

## Usage

(most of this doesn't work yet)

```js
const peernet = new PeerNet({ id: 'callumacrae' });
const peernetRemote = new PeerNet({ id: 'remoteUser' });

// Setup
peernetRemote.createNetwork(); // not even sure this is needed
const token = peernet.getToken();
peernetRemote.invite(token);

// Broadcast
peernet.emit('message', { some: 'object' });
peernet.on('message', (obj) => console.log(obj));

// Channel
const channel = peernet.channel('remoteUser');
channel.open(); // Do this automatically
channel.on('slap', () => console.log('ouch!'));
channel.emit('slap');

// Stats
peernet.stats(); // number of people, packet loss, stuff
peernet.map(); // Something to give to d3
```

## License

Dual licensed.

- GPL
- MIT if you email callum[at]macr.ae telling me what you're doing with it. Feel
free to use for commercial purposes! I'm just curious.
