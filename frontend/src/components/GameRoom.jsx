import '../styles/GameRoom.css';

import React, { useEffect, useState } from 'react';
import socket from '../socket';

const GameRoom = ({ roomInfo }) => {
    const [teams, setTeams] = useState({ A: [], B: [] });
    const [turn, setTurn] = useState(null);
    const [kelimeData, setKelimeData] = useState(null);
    const [tahmin, setTahmin] = useState('');
    const [tahminSonucu, setTahminSonucu] = useState('');
    const [sureAktif, setSureAktif] = useState(false);
    const [kalanSure, setKalanSure] = useState(60);

    useEffect(() => {
        socket.on('roomUpdate', ({ teams }) => {
            setTeams(teams);
        });

        socket.on('gameStart', ({ teams, turn }) => {
            setTeams(teams);
            setTurn(turn);
        });

        socket.on('kelimeGeldi', (data) => {
            setKelimeData(data);
            setTahminSonucu('');
            setTahmin('');
        });

        socket.on('tahminSonucu', (sonuc) => {
            setTahminSonucu(sonuc);
            // Burada kelimeData'yı sıfırlama! Yeni kelime zaten 'kelimeGeldi' ile set ediliyor.
        });

        socket.on('sureBasladi', () => {
            setSureAktif(true);
            setKalanSure(60);

            const interval = setInterval(() => {
                setKalanSure((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setSureAktif(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        socket.on('sureBitti', () => {
            setSureAktif(false);
        });

        return () => {
            socket.off('roomUpdate');
            socket.off('gameStart');
            socket.off('kelimeGeldi');
            socket.off('tahminSonucu');
            socket.off('sureBasladi');
            socket.off('sureBitti');
        };
    }, []);

    const benimRolum = teams[roomInfo.team]?.[0] === socket.id ? 'anlatıcı' : 'tahminci';

    const tahminGonder = () => {
        socket.emit('tahminYap', {
            roomId: roomInfo.roomId,
            tahmin: tahmin.trim()
        });
        setTahmin('');
    };

    return (
        <div className="container">
            <h2 className="title">Oyun Odası</h2>

            <div className="section">
                <p><strong>Oda Kodu:</strong> {roomInfo.roomId}</p>
                <p><strong>Senin Takımın:</strong> {roomInfo.team}</p>
                <p><strong>Rolün:</strong> {benimRolum}</p>
                <p><strong>Sıra:</strong> Takım {turn}</p>

                {sureAktif && (
                    <p className="timer">⏳ Kalan Süre: {kalanSure} saniye</p>
                )}

                {/* 🔘 Sıra sende ve anlatıcıysan başla butonu */}
                {benimRolum === 'anlatıcı' && turn === roomInfo.team && !sureAktif && (
                    <button className="button" onClick={() => socket.emit('startTurn', roomInfo.roomId)}>
                        ▶️ Başla
                    </button>
                )}

                {/* 🔍 Anlatıcı VEYA karşı takımda isen kelimeyi göster */}
                {kelimeData && (benimRolum === 'anlatıcı' || roomInfo.team !== turn) && (
                    <div className="section">
                        <h3>🎯 Anlatılacak Kelime: {kelimeData.kelime}</h3>
                        <p>❌ Yasaklı Kelimeler: {kelimeData.yasaklilar.join(', ')}</p>
                    </div>
                )}


                {/* ✅ Sadece tahminci için input */}
                {benimRolum === 'tahminci' && (
                    <div className="section">
                        <input
                            type="text"
                            placeholder="Tahmininizi yazın"
                            value={tahmin}
                            onChange={(e) => setTahmin(e.target.value)}
                        />
                        <button className="button" onClick={tahminGonder}>Gönder</button>
                        {tahminSonucu && (
                            <p style={{ color: tahminSonucu === 'Doğru!' ? 'green' : 'red' }}>
                                {tahminSonucu}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="player-layout">
                <div className="top-player">
                    <p>{teams.B[0] || 'Bekleniyor...'}</p>
                </div>

                <div className="middle-row">
                    <div className="left-player">
                        <p>{teams.A[1] || 'Bekleniyor...'}</p>
                    </div>

                    <div className="game-center">
                        <p><strong>Sıra:</strong> Takım {turn}</p>
                        {sureAktif && <p>⏳ {kalanSure}sn</p>}
                    </div>

                    <div className="right-player">
                        <p>{teams.B[1] || 'Bekleniyor...'}</p>
                    </div>
                </div>

                <div className="bottom-player">
                    <p>{teams.A[0] || 'Bekleniyor...'}</p>
                </div>
            </div>

        </div>
    );

};

export default GameRoom;
