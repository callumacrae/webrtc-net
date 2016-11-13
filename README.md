# Peernet

WebRTC powered network using a gossip algorithm to propagate messages.

WIP. Very WIP.

Recommended reading: http://medianetlab.ee.ucla.edu/papers/chapter_P2P_hpark.pdf

## Usage

(most of this doesn't work yet)

```js
const peernet = new PeerNet();
const peernetRemote = new PeerNet();

// Setup
const token = peernet.getToken();
peernetRemote.invite(token);

// Broadcast
peernet.broadcast({ some: 'object' });
peernet.on('message', (obj) => console.log(obj));

peernet.insecureDm(token, 'insecure DM content');

// Channel
const channel = peernet.channel('remoteUser');
channel.on('message', (msg) => console.log(msg));
channel.send('test message');

// Stats
peernet.stats(); // number of people, packet loss, stuff
peernet.map(); // Something to give to d3
```

## License

Dual licensed.

- GPL
- MIT if you email callum[at]macr.ae telling me what you're doing with it. Feel
free to use for commercial purposes! I'm just curious.
