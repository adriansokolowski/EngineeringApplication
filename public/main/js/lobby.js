$(function() {
  var socket = io();
  var KOLORY = [
    '#007bff', '#6610f2', '#6f42c1', '#e83e8c',
    '#dc3545', '#fd7e14', '#ffc107', '#28a745',
    '#20c997', '#17a2b8', '#a700ff', '#d300e7'
  ];
  var CZAS_ZANIKANIA = 150; 
  var LICZNIK_PISANIA = 400;
  

  var $oknoPrzegladarki = $(window);
  var $nazwa_uzytkownika = $('.nazwa_uzytkownika');
  var $wiadomosci = $('.wiadomosci');
  var $napiszWiadomosc = $('.napiszWiadomosc');

  var $logowanieStrona = $('#logowanie');
  var $lobbyStrona = $('#lobby'); 

  var uzytkownik;
  var polaczony = false;
  var pisze = false;
  var ostatniaWiadomosc;
  var $aktywnePoleTekstowe = $nazwa_uzytkownika.focus();

  

  const addParticipantsMessage = (data) => {
    if (data.iloscGraczy === 1) {

	  document.getElementById("Total_Connections").innerHTML = 1;

    } else {
	  
	  document.getElementById("Total_Connections").innerHTML = data.iloscGraczy;
    }
  }
  
	var userList = [];

    socket.on('update', function (gracze){
        userList = gracze;
        $('nav-link').empty();
        for(var i=0; i<userList.length; i++) {
			console.log(userList[i]);
			$('#gracze_online ul').attr('class', 'nav flex-column').append(
				$('<li>').attr('class', 'nav-item').append(
				$('<a>').attr({'class': 'nav-link', 'href': '#'}).append('<span data-feather="user"></span>' + ' ' + userList[i])
		))};    
			
			feather.replace()
        
    });
  
  const setUsername = () => {
    uzytkownik = cleanInput($nazwa_uzytkownika.val().trim());

    if (uzytkownik) {
      $logowanieStrona.fadeOut();
      $lobbyStrona.show();
      $logowanieStrona.off('click');
      $aktywnePoleTekstowe = $napiszWiadomosc.focus();

      socket.emit('dodaj gracza', uzytkownik);
    }
  }

  $("button").click(function(event){
	  event.preventDefault(); 
		setUsername();
	});
  
  const sendMessage = () => {
    var message = $napiszWiadomosc.val();
    message = cleanInput(message);
    if (message && polaczony) {
      $napiszWiadomosc.val('');
      addChatMessage({
        uzytkownik: uzytkownik,
        message: message
      });
      socket.emit('nowa wiadomosc', message);
    }
  }

    const log = (message, options) => {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  const addChatMessage = (data, options) => {
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="uzytkownik"/>')
      .text(data.uzytkownik)
      .css('color', getUsernameColor(data.uzytkownik));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.pisze ? 'pisze' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('uzytkownik', data.uzytkownik)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  const addChatTyping = (data) => {
    data.pisze = true;
    data.message = 'pisze';
    addChatMessage(data);
  }

  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  const addMessageElement = (el, options) => {
    var $el = $(el);

    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    if (options.fade) {
      $el.hide().fadeIn(CZAS_ZANIKANIA);
    }
    if (options.prepend) {
      $wiadomosci.prepend($el);
    } else {
      $wiadomosci.append($el);
    }
    $wiadomosci[0].scrollTop = $wiadomosci[0].scrollHeight;
  }

  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  const updateTyping = () => {
    if (polaczony) {
      if (!pisze) {
        pisze = true;
        socket.emit('pisze');
      }
      ostatniaWiadomosc = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - ostatniaWiadomosc;
        if (timeDiff >= LICZNIK_PISANIA && pisze) {
          socket.emit('stop typing');
          pisze = false;
        }
      }, LICZNIK_PISANIA);
    }
  }

  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
      return $(this).data('uzytkownik') === data.uzytkownik;
    });
  }

  const getUsernameColor = (uzytkownik) => {
    var hash = 7;
    for (var i = 0; i < uzytkownik.length; i++) {
       hash = uzytkownik.charCodeAt(i) + (hash << 5) - hash;
    }
    var index = Math.abs(hash % KOLORY.length);
    return KOLORY[index];
  }

  $oknoPrzegladarki.keydown(event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $aktywnePoleTekstowe.focus();
    }
    if (event.which === 13) {
      if (uzytkownik) {
        sendMessage();
        socket.emit('stop typing');
        pisze = false;
      } else {
        setUsername();
      }
    }
  });

  $napiszWiadomosc.on('input', () => {
    updateTyping();
  });

  $logowanieStrona.click(() => {
    $aktywnePoleTekstowe.focus();
  });

  $napiszWiadomosc.click(() => {
    $napiszWiadomosc.focus();
  });

  socket.on('login', (data) => {
    polaczony = true;
    var message = "Witaj, jesteś w tej chwili w lobby, wybierz pokój, aby rozpocząć rozgrywkę.";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('nowa wiadomosc', (data) => {
    addChatMessage(data);
  });

  socket.on('user joined', (data) => {
    log(data.uzytkownik + ' dołączył do lobby.');
    addParticipantsMessage(data);
  });

  socket.on('user left', (data) => {
    log(data.uzytkownik + ' wyszedł');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  socket.on('pisze', (data) => {
    addChatTyping(data);
  });

  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });

  socket.on('disconnect', () => {
    log('rozstałeś rozłączony');
  });

  socket.on('reconnect', () => {
    log('zostałeś podłączony ponownie');
    if (uzytkownik) {
      socket.emit('dodaj gracza', uzytkownik);
    }
  });

  socket.on('reconnect_error', () => {
    log('próba ponownego połączenia nie powiodła się');
  });

});