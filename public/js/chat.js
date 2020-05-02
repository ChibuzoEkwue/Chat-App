const socket = io()
// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar');
// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll =()=>{
   // new message elements
   const $newMessage =$messages.lastElementChild

   // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
   const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
   
   // visibleHeight
   const visibleHeight =$messages.offsetHeight;

   // height 
   const containerHeight =$messages.scrollHeight

   // how far have i scrolled 

   const scrollOffset =$messages.scrollTop + visibleHeight

   if(containerHeight - newMessageHeight <= scrollOffset){
       $messages.scrollTop=$messages.scrollHeight
   }

}

socket.on('roomData',({room,users})=>{
   const html = Mustache.render(sideBarTemplate,{
       room,
       users
   })
   $sidebar.innerHTML=html

})

socket.on('message', (socket) => {
    const html = Mustache.render(messageTemplate, {
        username:socket.username,
        message: socket.text,
        createdAt: moment(socket.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
    //console.log(socket)
})

socket.on('location', (location) => {
    const html = Mustache.render(locationTemplate, {
        username:location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value;
    socket.emit("sendMessage", message, (error, success) => {
        // enable 
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ""
        $messageFormInput.focus()
        if (error) {
            return alert(error)
        }
        console.log(success)
    });
})

document.querySelector('#send-location').addEventListener('click', () => {
    // Disabled

    $sendLocationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported")
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        //console.log(position)
        socket.emit("sendLocation", {
            latitude,
            longitude
        }, (message) => {
            $sendLocationButton.removeAttribute('disabled')
            console.log(message)
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
     alert(error)
     location.href='/'
    }
})