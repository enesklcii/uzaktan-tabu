import { io } from 'socket.io-client';

// Sunucunun adresi
const socket = io('http://localhost:3000'); // Gerekirse IP veya domain ile değiştir

export default socket;
