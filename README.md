# webrtc-net

WebRTC powered network using a gossip algorithm to propagate messages.

WIP. Very WIP.

Recommended reading: http://medianetlab.ee.ucla.edu/papers/chapter_P2P_hpark.pdf

## Usage

(most of this doesn't work yet)

```js
const webRTCnet = new WebRTCNet();
const webRTCnetRemote = new WebRTCNet();

// Setup
const token = webRTCnet.getToken();
webRTCnetRemote.invite(token);

// Broadcast
webRTCnet.broadcast({ some: 'object' });
webRTCnet.on('message', (obj) => console.log(obj));

webRTCnet.insecureDm(token, 'insecure DM content');

// Channel
const channel = webRTCnet.channel('remoteUser');
channel.on('message', (msg) => console.log(msg));
channel.send('test message');

// Stats
webRTCnet.stats(); // number of people, packet loss, stuff
webRTCnet.map(); // Something to give to d3
```

## License

Dual licensed.

- GPL
- MIT if you email callum[at]macr.ae telling me what you're doing with it. Feel
free to use for commercial purposes! I'm just curious.
