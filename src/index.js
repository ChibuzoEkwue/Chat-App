const express = require('express');
const path = require('path');
const socketio = require('socket.io')
const http = require('http');
const Fliter = require('bad-words')
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const { generateMessage, generateLocationMessage } = require('../src/utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('../src/utils/users')
app.use(express.static(path.join(__dirname, "../public")));
const port = process.env.PORT || 3000;


io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join', (options,callback) => {

        const {error,user}= addUser({id:socket.id,...options})

        if(error){

         return callback(error)

        }

        socket.join(user.room)

        socket.emit('message', generateMessage("Chat App",'Welcome'))

        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage', (message, callback) => {
        const fliter = new Fliter()
        const user = getUser(socket.id)
        if (fliter.isProfane(message)) {
            return callback("Profanity is not allowed", undefined)
        }
        io.to(user.room).emit('message', generateMessage(user.username,message))
        callback(undefined, "Delivered")
    })

    socket.on('sendLocation', (cords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('location', generateLocationMessage(user.username,`https://www.google.com/maps?q=${cords.latitude},${cords.longitude}`))
        callback('Location Shared!')
    })
    socket.on('disconnect', () => {
       const user =  removeUser(socket.id)
       if(user){
           io.to(user.room).emit('message', generateMessage("Chat App",`${user.username} has left`))
           io.to(user.room).emit('roomData',{
               room:user.room,
               users:getUsersInRoom(user.room)
           })
       }
        
    })
})
server.listen(port, () => {
    console.log(`server runninng on port ${port}`)
})
