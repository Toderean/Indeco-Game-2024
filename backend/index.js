const Koa = require('koa'),
    route = require('koa-route'),
    websockify = require('koa-websocket')
serve = require('koa-simple-static').default;
const app = websockify(new Koa());
const { randomUUID } = require('crypto')

const users = []
const sockets = []

const broadcast = (message) => {
    sockets.map(({ socket }) => socket.send(message))
}

// Regular middleware
// Note it's app.ws.use and not app.use
app.ws.use(function (ctx, next) {
    // return `next` to pass the context (ctx) on to the next ws middleware
    return next(ctx);
});

// Using routes
app.ws.use(route.all('/', function (ctx) {
    ctx.websocket.send(JSON.stringify({ messageType: 'connection', message: 'Connected to WebSocket successfully.'}));
    ctx.websocket.on('message', function (message) {
        // do something with the message from client
        try {
            const parsedMessage = JSON.parse(message)
            //TODO: use switch instead
            if(parsedMessage.messageType === 'authentication') {
                const { registerAs } = JSON.parse(message)
                    
                if(users.findIndex((user) => user.username === registerAs) >= 0) {
                    ctx.websocket.send(JSON.stringify({ messageType: 'registerError', message:"User with this name already exists." }));
                } else {
                    const userId = randomUUID()
                    const newUser = { userId, username: registerAs }

                    users.push(newUser)
                    sockets.push({ userId, socket: ctx.websocket })

                    ctx.websocket.send(JSON.stringify({ messageType: 'authentication', ...newUser }))
                    broadcast(JSON.stringify({ messageType: 'userRefresh', users }))
                }
            }

            if(parsedMessage.messageType === 'joinRequest'){
                const { userData } = parsedMessage
                const userSocket = sockets.find((socket) => socket.userId === userData.userId)

                userSocket.send(JSON.stringify({ messageType: 'joinRequest', requesterData: userData }))
            }
        } catch (err) {
            console.log(err)
        }
    });
}));

//TODO: handle user disconnects

app.use(serve({
    dir: '../frontend/dist',
    index: 'index.html',
}))

app.use(route.get('/helloword', function (ctx) {
    ctx.body = 'Hello World!';
}
));

app.listen(8080, () => {
    console.log("Listening on port 8080")
});
