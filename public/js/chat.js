const socket = io()

const form = document.querySelector('#message-form')
const input = document.querySelector('#msg-box')
const button = document.querySelector('#message-button')
const sndbtn = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML
 
const autoscroll = () => {
  //New message element
  const newMessage = messages.lastElementChild

  //height of the new message
  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin

  //visible height
  const visibleHeight = messages.offsetHeight
  //height of message container
  const containerHeight = messages.scrollHeight
  const scrollOffset = messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight
  }
}

socket.on('Message', (message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAT: moment(message.createdAT).format('h:mm a')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationmessage', (message) => {
  console.log(message)
  const html = Mustache.render(urlTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAT).format('h:m a')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({ room, users }) => {
  console.log(room,users)
  const html = Mustache.render(sideBarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

form.addEventListener('submit', (e) => {
  e.preventDefault()

  button.setAttribute('disabled', 'disabled')

  const message = input.value

  socket.emit('sendMessage', message, (error) => {
    button.removeAttribute('disabled')
    input.value = ''
    input.focus()
    if(error) {
      return console.log(error)
    }
  })
})

sndbtn.addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert('Geoloacation is not supported by your browser')
  }

  sndbtn.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      sndbtn.removeAttribute('disabled')
      console.log('Location shared')
    })
  })
})

socket.emit('join', {username, room}, (error) => {
  if(error) {
    alert(error)
    location.href = '/'
  }
})

