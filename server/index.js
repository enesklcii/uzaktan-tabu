const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});


const PORT = 3000;

let rooms = {};

io.on('connection', (socket) => {
    console.log('Bir oyuncu bağlandı:', socket.id);

    socket.on('createRoom', () => {
        const roomId = uuidv4();
        rooms[roomId] = {
            players: [socket.id],
            teams: { A: [socket.id], B: [] },
            scores: { A: 0, B: 0 },
            turn: 'A',
        };
        socket.join(roomId);
        socket.emit('roomCreated', { roomId });
        console.log(`Oda oluşturuldu: ${roomId}`);
    });

    socket.on('joinRoom', (roomId) => {
        const room = rooms[roomId];
        if (room && room.players.length < 4) {
            socket.join(roomId);
            room.players.push(socket.id);

            const playerCount = room.players.length;
            const team = (playerCount % 2 === 1) ? 'A' : 'B';
            room.teams[team].push(socket.id);

            socket.emit('joinedRoom', { roomId, team });
            io.to(roomId).emit('roomUpdate', {
                players: room.players,
                teams: room.teams,
                scores: room.scores,
            });

            if (room.players.length === 4) {
                io.to(roomId).emit('gameStart', {
                    teams: room.teams,
                    turn: room.turn,
                });

                const kelimeListesi = JSON.parse(
                    fs.readFileSync(path.join(__dirname, 'words.json'), 'utf-8')
                );
                const rastgele = kelimeListesi[Math.floor(Math.random() * kelimeListesi.length)];
                room.kelime = rastgele;

                const anlatıcıId = room.teams[room.turn][0];
                io.to(anlatıcıId).emit('kelimeGeldi', rastgele);
            }
        } else {
            socket.emit('joinError', 'Oda dolu veya mevcut değil');
        }
    });

    socket.on('startTurn', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        const kelimeListesi = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'words.json'), 'utf-8')
        );
        const rastgele = kelimeListesi[Math.floor(Math.random() * kelimeListesi.length)];
        room.kelime = rastgele;

        const aktifTakim = room.turn;
        const digerTakim = aktifTakim === 'A' ? 'B' : 'A';

        // 🔹 Kelimeyi sadece anlatıcıya ve karşı takıma gönder
        const anlaticiId = room.teams[aktifTakim][0];
        io.to(anlaticiId).emit('kelimeGeldi', rastgele);
        room.teams[digerTakim].forEach(id => {
            io.to(id).emit('kelimeGeldi', rastgele);
        });

        room.sureAktif = true;
        io.to(roomId).emit('sureBasladi', { turn: aktifTakim });

        setTimeout(() => {
            room.sureAktif = false;
            room.turn = digerTakim;
            io.to(roomId).emit('sureBitti');
            io.to(roomId).emit('gameStart', {
                teams: room.teams,
                turn: room.turn
            });
        }, 60000);
    });



    socket.on('tahminYap', ({ roomId, tahmin }) => {
        const room = rooms[roomId];
        if (!room || !room.kelime || !room.sureAktif) return;

        let oyuncuTakimi = null;
        if (room.teams.A.includes(socket.id)) oyuncuTakimi = 'A';
        else if (room.teams.B.includes(socket.id)) oyuncuTakimi = 'B';
        if (!oyuncuTakimi || oyuncuTakimi !== room.turn) {
            socket.emit('tahminSonucu', 'Sıra sizde değil!');
            return;
        }

        const dogruCevap = room.kelime.kelime.toLowerCase();
        const gelenTahmin = tahmin.toLowerCase();

        if (gelenTahmin === dogruCevap) {
            room.scores[room.turn] += 1;

            const kelimeListesi = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'words.json'), 'utf-8')
            );
            const rastgele = kelimeListesi[Math.floor(Math.random() * kelimeListesi.length)];
            room.kelime = rastgele;

            const aktifTakim = room.turn;
            const digerTakim = aktifTakim === 'A' ? 'B' : 'A';
            const anlaticiId = room.teams[aktifTakim][0];

            io.to(anlaticiId).emit('kelimeGeldi', rastgele);
            room.teams[digerTakim].forEach(id => {
                io.to(id).emit('kelimeGeldi', rastgele);
            });

            socket.emit('tahminSonucu', 'Doğru!');
            io.to(roomId).emit('roomUpdate', {
                players: room.players,
                teams: room.teams,
                scores: room.scores
            });
        } else {
            socket.emit('tahminSonucu', 'Yanlış!');
        }
    });






    socket.on('disconnect', () => {
        console.log('Bir oyuncu çıktı:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const index = room.players.indexOf(socket.id);
            if (index !== -1) {
                room.players.splice(index, 1);
                room.teams.A = room.teams.A.filter(id => id !== socket.id);
                room.teams.B = room.teams.B.filter(id => id !== socket.id);
                io.to(roomId).emit('roomUpdate', {
                    players: room.players,
                    teams: room.teams,
                    scores: room.scores,
                });
                if (room.players.length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});





server.listen(PORT, () => {
    console.log(`Tabu sunucusu ${PORT} portunda çalışıyor`);
});
