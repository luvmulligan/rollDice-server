const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { v4: uuidv4 } = require('uuid'); // para generar IDs únicos
const sessions = {}; // Guardarás las sesiones activas y los usuarios

// Datos del juego
// let players = []; // Lista de jugadores
let users = []; // Lista de jugadores

// let currentPlayerIndex = 0; // Índice del jugador actual

// let turnDices = [];
// let blackDice = 1;
// let canRoll = true;
// let multipliedScore;
// let canParenMaren = false;
// var player = new Object({ id: socket.id, score: 0, turnDices: [], canRoll: false, canParenMaren: false });

// Función para lanzar un dado

// Cuando se conecta un jugador
io.on('connection', (socket) => {
  // console.log(`Jugador conectado: ${socket.id}`);
  // Crear una nueva sesión
  socket.on('createSession', () => {
    const sessionId = uuidv4(); // Generar un ID único para la sesión
    sessions[sessionId] = { users: [], started: false };

    // Enviar el ID de la nueva sesión al cliente que solicitó la creación
    socket.emit('sessionCreated', { sessionId });
    console.log(`Sesión creada con ID: ${sessionId}`);
  });

  // Unirse a una sesión con un ID
  // Unirse a una sesión
  socket.on('joinSession', ({ sessionId, userName }) => {
    if (sessions[sessionId]) {
      const user = { id: socket.id, name: userName, ready: false };

      // Agregar usuario a la sesión
      sessions[sessionId].users.push(user);
      socket.join(sessionId); // Unir socket a una "sala" con el ID de sesión

      // Enviar actualización de la lista de usuarios a todos los usuarios en esa sesión
      io.to(sessionId).emit('sessionUpdate', sessions[sessionId].users);
    } else {
      socket.emit('error', 'Sesión no encontrada');
    }
  });
  // Actualizar nombre de usuario
  socket.on('updateName', ({ sessionId, newName }) => {
    const session = sessions[sessionId];
    if (session) {
      const user = session.users.find((u) => u.id === socket.id);
      if (user) {
        user.name = newName;
        users.push({ name: user.name, score: 0 });
        io.to(sessionId).emit('sessionUpdate', session.users);
      }
    }
  });

  // Marcar que el usuario está listo
  socket.on('ready', ({ sessionId, isReady }) => {
    const session = sessions[sessionId];
    if (session) {
      const user = session.users.find((u) => u.id === socket.id);
      if (user) {
        user.ready = isReady;
        io.to(sessionId).emit('sessionUpdate', session.users);
      }
      // if (user && !user.ready) {
      //   user.ready = false;
      //   io.to(sessionId).emit('sessionUpdate', session.users);
      // }
    }
  });
  socket.on('disconnect', () => {
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      session.users = session.users.filter((u) => u.id !== socket.id);
      io.to(sessionId).emit('sessionUpdate', session.users);
    }
  });

  // Agregar el jugador a la lista
  // players.push({ name: '', id: socket.id, score: 0, turnDices: [], canRoll: false, canParenMaren: false });

  // Avisar a los jugadores actuales
  // io.emit('playersUpdate', players);

  // Comenzar la partida (darle el primer turno al último jugador que se unió)

  // currentPlayerIndex = currentPlayerIndex % players.length;
  // io.emit('gameStart', players[currentPlayerIndex].id);

  // Escuchar cuando un jugador lanza los dados
  // socket.on('rollDice', () => {
  //   if (players[currentPlayerIndex].id === socket.id) {
  //     const diceResult = rollDice();

  //     // Actualizar el puntaje del jugador

  //     players[currentPlayerIndex].turnDices.push({ rollResult: diceResult });

  //     if (diceResult > 3) {
  //       canParenMaren = true;
  //       players[currentPlayerIndex].canParenMaren = canParenMaren;
  //       canRoll = true;
  //       players[currentPlayerIndex].canRoll = canRoll;
  //     }
  //     if (diceResult < 4) {
  //       canRoll = false;
  //       canParenMaren = false;
  //       players[currentPlayerIndex].canParenMaren = canParenMaren;
  //       players[currentPlayerIndex].score += diceResult;
  //       players[currentPlayerIndex].canRoll = canRoll;
  //       players[currentPlayerIndex].turnDices = [];
  //     }
  //     if (players[currentPlayerIndex].turnDices.length >= 4) {
  //       canRoll = false;
  //       canParenMaren = false;
  //       players[currentPlayerIndex].canParenMaren = canParenMaren;
  //       players[currentPlayerIndex].canRoll = canRoll;
  //       players[currentPlayerIndex].turnDices = [];
  //     }

  //     //Actualizar variables de juego
  //     // if (diceResult > 3) {
  //     //   canRoll = true;
  //     //   players[currentPlayerIndex].canRoll = canRoll;
  //     // } else {
  //     //   canRoll = false;
  //     //   canParenMaren = false;
  //     //   players[currentPlayerIndex].canParenMaren = canParenMaren;
  //     //   players[currentPlayerIndex].canRoll = canRoll;
  //     // }

  //     //   if (diceResult > 4) {
  //     //     canParenMaren = true;
  //     //   } else {
  //     //     canParenMaren = false;
  //     //   }
  //     // if (players[currentPlayerIndex].turnDices.length === 4) {
  //     //   players[currentPlayerIndex].turnDices = [];
  //     // }
  //     players[currentPlayerIndex].score += diceResult;

  //     // Enviar resultado del dado a todos los jugadores
  //     io.emit('diceResult', {
  //       playerId: socket.id,
  //       result: diceResult,
  //       score: players[currentPlayerIndex].score,
  //       turnDices: players[currentPlayerIndex].turnDices,
  //       canParenMaren: players[currentPlayerIndex].canParenMaren,
  //       canRoll: players[currentPlayerIndex].canRoll
  //     });

  //     // Pasar el turno al siguiente jugador
  //     if (!canRoll) {
  //       currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  //       io.emit('turnUpdate', players[currentPlayerIndex].id);
  //       // players[currentPlayerIndex].turnDices = [];

  //       setTimeout(() => {
  //         // players[currentPlayerIndex].turnDices = [];
  //       }, 1000);

  //       // io.emit('playersUpdate', players);
  //     }
  //     io.emit('playersUpdate', players);
  //   } else {
  //     socket.emit('notYourTurn', 'No es tu turno');
  //   }
  // });

  // Desconexión del jugador
  // socket.on('disconnect', () => {
  //   console.log(`Jugador desconectado: ${socket.id}`);
  //   players = players.filter((player) => player.id !== socket.id);

  //   // Actualizar el estado de los jugadores
  //   io.emit('playersUpdate', players);

  //   if (players.length === 0) {
  //     currentPlayerIndex = 0; // Reiniciar el índice si no hay jugadores
  //   } else if (players[currentPlayerIndex] === undefined) {
  //     currentPlayerIndex = 0; // Reiniciar al primer jugador si el actual se va
  //   }

  //   io.emit('turnUpdate', players[currentPlayerIndex]?.id);
  // });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
