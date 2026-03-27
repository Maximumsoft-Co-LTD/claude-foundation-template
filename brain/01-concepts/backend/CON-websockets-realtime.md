---
type: concept
tags: [backend, websockets, real-time, SSE, polling, socket-io]
related: [CON-async-patterns, CON-api-design-principles, CON-scalability-patterns, CON-backend-layers]
updated: 2026-03-25
source: template
---

# WebSockets & Real-Time

Techniques for pushing data to clients in real-time.

## Comparison: Polling vs Long Polling vs SSE vs WebSockets

| Feature | Polling | Long Polling | SSE | WebSocket |
|---------|---------|--------------|-----|-----------|
| **Protocol** | HTTP | HTTP | HTTP | TCP upgrade |
| **Direction** | Client pull | Client pull | Server push | Bidirectional |
| **Latency** | High (seconds) | Low (100ms) | Low (10ms) | Very low (<10ms) |
| **Overhead** | High (requests) | Medium | Low | Very low |
| **Browser Support** | ✓ All | ✓ All | ✓ Modern | ✓ Modern |
| **Fallback Needed** | No | No | No (polyfill possible) | Yes (Long Polling) |
| **Use Case** | Status checks | Notifications | Dashboards | Chat, games, trading |
| **Complexity** | Very simple | Simple | Simple | Medium |
| **Infrastructure** | Stateless | Stateless | Stateless | Stateful (sticky sessions) |

## Polling

Client repeatedly asks for updates.

```
Client              Server
  │─ GET /status ──>│
  │<─ 200 OK ──────│
  │ (wait 5 sec)    │
  │─ GET /status ──>│
  │<─ 200 OK ──────│
  │ (wait 5 sec)    │
  │─ GET /status ──>│
  │<─ 200 OK ──────│
```

**Pros**: Simple, stateless. **Cons**: Wasteful (many requests), high latency.

```javascript
// Client-side
setInterval(() => {
  fetch('/api/status')
    .then(r => r.json())
    .then(data => updateUI(data));
}, 5000); // Poll every 5 seconds
```

## Long Polling

Client asks, server holds response until data available.

```
Client              Server
  │─ GET /status ──>│
  │ (waiting...)    │ (waiting for update)
  │<─ 200 + data ──│ (when data arrives, send)
  │                 │
  │─ GET /status ──>│ (client immediately re-requests)
  │ (waiting...)    │ (waiting for next update)
```

**Pros**: Lower latency than polling, simple. **Cons**: Scalability (many hanging requests), more overhead.

```javascript
// Client-side
async function longPoll() {
  try {
    const response = await fetch('/api/status', { timeout: 30000 });
    const data = await response.json();
    updateUI(data);
  } catch (e) {
    // Timeout or error, retry
  }
  // Always re-request
  longPoll();
}

longPoll();
```

```python
# Server-side (Flask example)
@app.route('/api/status')
def status():
    timeout = time.time() + 30  # 30-second timeout

    while time.time() < timeout:
        data = db.get_latest_update()
        if data:
            return jsonify(data)
        time.sleep(0.5)  # Poll DB every 500ms

    # Timeout reached, return empty (client will retry)
    return jsonify(None)
```

## Server-Sent Events (SSE)

Server pushes updates over a single HTTP connection.

```
Client              Server
  │─ GET /stream ──>│
  │<─ 200 ──────────│
  │ (persistent)    │
  │<─ data: {...} ──│
  │<─ data: {...} ──│
  │<─ data: {...} ──│
```

**Pros**: Simple, one-way push, HTTP. **Cons**: Unidirectional, limited to HTTP (no binary).

```javascript
// Client-side
const eventSource = new EventSource('/api/stream');

eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
});

eventSource.addEventListener('error', () => {
  // Automatic reconnect with backoff
});
```

```python
# Server-side
from flask import Response

@app.route('/api/stream')
def stream():
    def generate():
        while True:
            data = db.get_latest_update()
            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(1)

    return Response(generate(), mimetype='text/event-stream')
```

### SSE Format

```
data: {"value": 42}

# With event type
event: update
data: {"value": 42}

# Multi-line data
data: {"value": 42,
data: "message": "hello"}

# Comment (ignored by client)
: this is a comment

# Heartbeat (keep-alive)
:

# Reconnect hint
retry: 5000
```

## WebSockets

Full-duplex communication over TCP with HTTP upgrade handshake.

### Handshake

```
Client ────────────────────────────────── Server
  │                                         │
  GET /chat HTTP/1.1                       │
  Upgrade: websocket                       │
  Connection: Upgrade                      │
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub... │
  Sec-WebSocket-Version: 13                │
  │─────────────────────────────────────>│
  │                                         │
  │  HTTP/1.1 101 Switching Protocols      │
  │  Upgrade: websocket                    │
  │  Connection: Upgrade                   │
  │  Sec-WebSocket-Accept: s3pP...         │
  │<─────────────────────────────────────│
  │                                         │
  │ (persistent TCP connection)             │
  │<──────── WebSocket Frame ────────────>│
  │<──────── WebSocket Frame ────────────>│
```

**Pros**: Bidirectional, low latency, binary support. **Cons**: Stateful, requires sticky sessions, more complex.

```javascript
// Client-side
const ws = new WebSocket('ws://example.com/chat');

ws.onopen = () => {
  ws.send(JSON.stringify({type: 'join', room: 'general'}));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  updateChat(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Reconnect with backoff
};

ws.onclose = () => {
  // Server closed, reconnect
};

// Send message
function sendMessage(text) {
  ws.send(JSON.stringify({type: 'message', text: text}));
}
```

```python
# Server-side (using websockets library)
import asyncio
import websockets
import json

async def handler(websocket, path):
    """Handle WebSocket connection."""
    try:
        async for message in websocket:
            data = json.loads(message)

            if data['type'] == 'message':
                # Broadcast to all connected clients
                await broadcast(json.dumps({
                    'type': 'message',
                    'user': websocket.remote_address,
                    'text': data['text']
                }))
    except websockets.exceptions.ConnectionClosed:
        pass

async def broadcast(message):
    """Send message to all connected clients."""
    for client in connected_clients:
        await client.send(message)

# Start server
async def main():
    async with websockets.serve(handler, 'localhost', 8765):
        await asyncio.Future()  # Run forever

asyncio.run(main())
```

## Socket.IO vs Raw WebSocket

### Raw WebSocket

- Low-level, manual handling
- No fallbacks, no rooms, no namespaces
- Lighter weight
- Good for simple cases

### Socket.IO

Higher-level library with features:

```javascript
// Server (Node.js)
const io = require('socket.io')(8000);

io.of('/chat').on('connection', (socket) => {
  socket.on('message', (data) => {
    socket.broadcast.emit('message', data); // Send to others
    // or
    io.of('/chat').emit('message', data); // Broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Client (JavaScript)
const socket = io('ws://localhost:8000/chat');

socket.on('message', (data) => {
  console.log(data);
});

socket.emit('message', {text: 'Hello'});
```

**Features Socket.IO adds**:
- Automatic reconnection with backoff
- Rooms and namespaces
- Fallback to Long Polling if WebSocket unavailable
- Acknowledgments (request-response pattern)
- Binary support

| Feature | Raw WebSocket | Socket.IO |
|---------|---|---|
| Reconnection | Manual | Automatic |
| Rooms | Manual (track clients) | Built-in |
| Fallback | None | Long Polling |
| Acknowledgments | Custom | Built-in |
| Complexity | Low | Medium |
| Weight | ~2KB | ~50KB |

## Scaling WebSockets Horizontally

Problem: WebSocket connections are stateful (sticky to server).

### Sticky Sessions

Route client to same server:

```
Load Balancer
  ├─ Server 1 (Client A, Client B)
  ├─ Server 2 (Client C)
  └─ Server 3 (Client D, Client E)

# If Client A reconnects, must go to Server 1
```

**Pros**: Simple. **Cons**: Can't redistribute on server failure; load imbalance.

### Redis Pub/Sub (Better)

Decouple connections from message routing:

```
Client A ──\
            ├─ Server 1 ─┐
Client B ──/             │
                          ├─ Redis Pub/Sub ─┐
Client C ──\             │                   ├─ All servers
            ├─ Server 2 ─┤                   │
Client D ──/             │                   │
                          ├─ Server 3 ──────┘
```

```python
# Server 1 (Redis Pub/Sub)
import redis
import asyncio

redis_pub = redis.Redis(host='localhost')

async def broadcast_to_room(room, message):
    """Publish to all servers subscribed to this room."""
    redis_pub.publish(f'room:{room}', json.dumps(message))

# All servers listen
redis_sub = redis.Redis(host='localhost')
pubsub = redis_sub.pubsub()
pubsub.subscribe('room:*')

for message in pubsub.listen():
    if message['type'] == 'message':
        # Deliver to locally connected clients in this room
        for client in get_local_clients(message['channel']):
            await client.send(message['data'])
```

## Use Cases

| Use Case | Best Tech | Reason |
|----------|-----------|--------|
| Chat | WebSocket or Socket.IO | Bidirectional, low latency, many concurrent connections |
| Live Dashboard | SSE or WebSocket | One-way push, simplicity (SSE) or interactivity (WS) |
| Notifications | Long Polling or SSE | One-way, infrequent |
| Collaborative Editing | WebSocket + CRDT | Bidirectional, need to sync edits in real-time |
| Real-time Games | WebSocket | Very low latency, bidirectional |
| Trading/Stock Tickers | WebSocket | High frequency updates, low latency critical |
| Email Notifications | Polling or SSE | Infrequent, user initiates check |
| Live Transcription | WebSocket | Continuous bidirectional stream |

## Real-World Example: Chat App

```python
# Flask + Flask-SocketIO
from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

# Track connected users
connected_users = {}

@socketio.on('connect')
def on_connect():
    print(f'User {request.sid} connected')
    connected_users[request.sid] = None

@socketio.on('join_room')
def on_join_room(data):
    room = data['room']
    username = data['username']
    join_room(room)
    connected_users[request.sid] = {'username': username, 'room': room}
    emit('message', {
        'text': f'{username} joined',
        'type': 'system'
    }, room=room)

@socketio.on('message')
def on_message(data):
    user = connected_users[request.sid]
    room = user['room']
    emit('message', {
        'text': data['text'],
        'username': user['username'],
        'timestamp': datetime.now().isoformat(),
        'type': 'user'
    }, room=room)

@socketio.on('disconnect')
def on_disconnect():
    user = connected_users.pop(request.sid, None)
    if user:
        emit('message', {
            'text': f'{user["username"]} left',
            'type': 'system'
        }, room=user['room'])

if __name__ == '__main__':
    socketio.run(app, debug=True)
```

## See Also

- [[CON-async-patterns]] — async programming
- [[CON-api-design-principles]] — real-time API design
- [[CON-scalability-patterns]] — horizontal scaling
- [[CON-backend-layers]] — architecture
