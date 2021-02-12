const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { generateLocationMessage } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')

// app.use(express.json())
app.use(express.static(publicDirectory))

let count = 0

var nsp = io.of('/projects/test_cases')

io.on('connection', (socket) => {

  console.log('New webSocket Connection')

  socket.on('join', ({username, room}, callback) => {

    const{ error, user } = addUser({ id: socket.id, username, room })
    if(error) {
      return callback(error)
    }
    socket.join(user.room)

    socket.emit('Message', generateMessage('Admin', 'Welcome'))
    socket.broadcast.to(user.room).emit('Message', generateMessage('Admin', `${user.username} has joined`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })

  socket.on("sendMessage", function (message, callback) {

    const user = getUser(socket.id)

    const filter = new Filter
    if(filter.isProfane(message)) {
      return callback('Profanity not allowed')
    }
    io.to(user.room).emit("Message", generateMessage(user.username, message))
    callback()
  })

  socket.on("sendLocation", (Location, callback) => {

    const user = getUser(socket.id)

    io.to(user.room).emit('locationmessage', generateLocationMessage(user.username, `https://google.com/maps?q=${Location.latitude},${Location.longitude}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if(user) {
      io.to(user.room).emit('Message', generateMessage('Admin', `${user.username} has left`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })

})

server.listen(port, () => {

  console.log('Server is up on port ' + port)
})

