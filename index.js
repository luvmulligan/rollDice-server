const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Datos del juego
let players = []; // Lista de jugadores
let currentPlayerIndex = 0; // Índice del jugador actual

let turnDices = [];
let blackDice = 1;
let canRoll = true;
let multipliedScore;
let canParenMaren = false;
// var player = new Object({ id: socket.id, score: 0, turnDices: [], canRoll: false, canParenMaren: false });

// Función para lanzar un dado

const rollDice = () => Math.floor(Math.random() * 6) + 1;

// Cuando se conecta un jugador
io.on('connection', (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  // Agregar el jugador a la lista
  players.push({ name: '', id: socket.id, score: 0, turnDices: [], canRoll: false, canParenMaren: false });

  // Avisar a los jugadores actuales
  io.emit('playersUpdate', players);

  // Comenzar la partida (darle el primer turno al último jugador que se unió)

  currentPlayerIndex = currentPlayerIndex % players.length;
  io.emit('gameStart', players[currentPlayerIndex].id);

  // Escuchar cuando un jugador lanza los dados
  socket.on('rollDice', () => {
    if (players[currentPlayerIndex].id === socket.id) {
      const diceResult = rollDice();

      // Actualizar el puntaje del jugador

      players[currentPlayerIndex].turnDices.push({ rollResult: diceResult });

      if (diceResult > 3) {
        canParenMaren = true;
        players[currentPlayerIndex].canParenMaren = canParenMaren;
        canRoll = true;
        players[currentPlayerIndex].canRoll = canRoll;
        // players[currentPlayerIndex].score += diceResult;
      } else {
        canRoll = false;
        canParenMaren = false;
        players[currentPlayerIndex].canParenMaren = canParenMaren;
        players[currentPlayerIndex].canRoll = canRoll;
        // players[currentPlayerIndex].turnDices = [];
      }
      if (players[currentPlayerIndex].turnDices.length >= 4) {
        canRoll = false;
        canParenMaren = false;
        players[currentPlayerIndex].canParenMaren = canParenMaren;
        players[currentPlayerIndex].canRoll = canRoll;
        // players[currentPlayerIndex].turnDices = [];
      }

      //Actualizar variables de juego
      // if (diceResult > 3) {
      //   canRoll = true;
      //   players[currentPlayerIndex].canRoll = canRoll;
      // } else {
      //   canRoll = false;
      //   canParenMaren = false;
      //   players[currentPlayerIndex].canParenMaren = canParenMaren;
      //   players[currentPlayerIndex].canRoll = canRoll;
      // }

      //   if (diceResult > 4) {
      //     canParenMaren = true;
      //   } else {
      //     canParenMaren = false;
      //   }
      // if (players[currentPlayerIndex].turnDices.length === 4) {
      //   players[currentPlayerIndex].turnDices = [];
      // }
      players[currentPlayerIndex].score += diceResult;

      // Enviar resultado del dado a todos los jugadores
      io.emit('diceResult', {
        playerId: socket.id,
        result: diceResult,
        score: players[currentPlayerIndex].score,
        turnDices: players[currentPlayerIndex].turnDices,
        canParenMaren: players[currentPlayerIndex].canParenMaren,
        canRoll: players[currentPlayerIndex].canRoll
      });

      // Pasar el turno al siguiente jugador
      if (!canRoll) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        io.emit('turnUpdate', players[currentPlayerIndex].id);
        players[currentPlayerIndex].turnDices = [];

        setTimeout(() => {
          // players[currentPlayerIndex].turnDices = [];
        }, 1000);

        // io.emit('playersUpdate', players);
      }
      io.emit('playersUpdate', players);
    } else {
      socket.emit('notYourTurn', 'No es tu turno');
    }
  });

  // Desconexión del jugador
  socket.on('disconnect', () => {
    console.log(`Jugador desconectado: ${socket.id}`);
    players = players.filter((player) => player.id !== socket.id);

    // Actualizar el estado de los jugadores
    io.emit('playersUpdate', players);

    if (players.length === 0) {
      currentPlayerIndex = 0; // Reiniciar el índice si no hay jugadores
    } else if (players[currentPlayerIndex] === undefined) {
      currentPlayerIndex = 0; // Reiniciar al primer jugador si el actual se va
    }

    io.emit('turnUpdate', players[currentPlayerIndex]?.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
