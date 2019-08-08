var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log('Serwer został uruchomiony na porcie %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

var iloscGraczy = 0;
var gracze = [];

io.on('connection', (socket) => {
  var graczDodany = false;


  socket.on('nowa wiadomosc', (data) => {

    socket.broadcast.emit('nowa wiadomosc', {
      uzytkownik: socket.uzytkownik,
      message: data
    });
  });

  socket.on('dodaj gracza', (uzytkownik) => {
    if (graczDodany) return;

    socket.uzytkownik = uzytkownik;
	gracze.push(socket.uzytkownik);
	updateClients();
    ++iloscGraczy;
    graczDodany = true;
    socket.emit('login', {
      iloscGraczy: iloscGraczy
	  
    });

    socket.broadcast.emit('user joined', {
      uzytkownik: socket.uzytkownik,
      iloscGraczy: iloscGraczy
	  
    });
  });
	
	function updateClients() {
        io.sockets.emit('update', gracze);
    }
	
  socket.on('pisze', () => {
    socket.broadcast.emit('pisze', {
      uzytkownik: socket.uzytkownik
    });
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      uzytkownik: socket.uzytkownik
    });
  });

  socket.on('disconnect', () => {
	  
	  for(let i=0; i<gracze.length; i++) {
			
             gracze.splice(i, 1);
			 console.log('Uzytkownicy:' + gracze[i]);
			
        }
		
        updateClients(); 
	  
    if (graczDodany) {
      --iloscGraczy;
		
		
      socket.broadcast.emit('user left', {
        uzytkownik: socket.uzytkownik,
        iloscGraczy: iloscGraczy
      });
    }
  });
});



var players;
var joined = true;

var games = Array(100);
for (let i = 0; i < 100; i++) {
    games[i] = {players: 0 , pid: [0 , 0]};
}

io.on('connection', function (socket) {
    var color;
    var playerId =  Math.floor((Math.random() * 100) + 1)
    


    socket.on('joined', function (roomId) {
        // games[roomId] = {}
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
        }
        else{
            socket.emit('full', roomId)
            return;
        }
        
        console.log(games[roomId]);
        players = games[roomId].players
        

        if (players % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;

        
    });

    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
        // console.log(msg);
    });

    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });

    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
                games[i].players--;
        }
        console.log(playerId + ' rozłączony');

    }); 

    
});



