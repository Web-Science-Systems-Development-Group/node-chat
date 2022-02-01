// server init + mods
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
const fetch = require('node-fetch');
const axios = require('axios')

// server route handler
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/funfact', async (req, res) => {
  const ourFact = await fetch("https://uselessfacts.jsph.pl/random.json").then((res) => res.json()); 
  io.emit("message", 'Fun fact! ' + ourFact.text);
  res.sendStatus(204);
});
app.post('/weather',async function(req,res){
  const city = req.query.city
  console.log(city)
  const weather = await getWeahter(city)
  io.emit("message", 'Weather Now: ' +weather.toString()+'°F');
  res.sendStatus(204);
})
async function getWeahter(city){
  apiKey = "db4171e3e4d490375715d4949cb14003";
  const res = await axios.get("https://api.openweathermap.org/data/2.5/weather?q="+city+"&units=imperial&appid=" + this.apiKey);
  const data = res.data.main.temp
  return data
}

// connect to mongodb
var db = mongoose.connection;
db.on('error', console.error);
mongoose.connect('mongodb://localhost/mychat');

// mongodb schemas
var chatMessage = new mongoose.Schema({
  username: String,
  message: String
});
var Message = mongoose.model('Message', chatMessage);

// user connected even handler
io.on('connection', function(socket){
  
  // log & brodcast connect event
  console.log('a user connected');
  
  // log disconnect event
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  
  // message received event handler
  socket.on('message', function(msg){
    // log chat msg
    console.log('message: ' + msg);
    
    // broadcast chat msg to others
    socket.broadcast.emit('message', msg);
    
    // save message to db
    var message = new Message ({
      message : msg
    });
    message.save(function (err, saved) {
      if (err) {
	return console.log('error saving to db');
      }
    })
  });
});

// start server
http.listen(3000, function(){
  console.log('Server up on *:3000');
});