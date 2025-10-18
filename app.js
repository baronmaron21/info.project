// === Module laden ===
const http = require('http');
const fs = require('fs');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const socketIO = require('socket.io');

// === 1) Serieller Port (Arduino) ===
const SERIAL_PATH = "COM5"; // <== Deinen COM-Port hier anpassen!
const BAUD_RATE = 9600;

const port = new SerialPort(SERIAL_PATH, { baudRate: BAUD_RATE }, (err) => {
  if (err) {
    return console.log('❌ Fehler beim Öffnen des seriellen Ports:', err.message);
  }
  console.log('✅ Serieller Port geöffnet:', SERIAL_PATH);
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
parser.on('data', (line) => {
  console.log('💬 Arduino sagt:', line);
});

// === 2) HTTP-Server (liefert index.html) ===
const server = http.createServer((req, res) => {
  fs.readFile('index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Fehler beim Laden der Seite');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// === 3) Socket.IO initialisieren ===
const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('🌐 Browser verbunden');

  socket.on('speed', (value) => {
    console.log('➡️ Empfangen von Browser:', value);

    let n = parseInt(value, 10);
    if (isNaN(n)) return;
    if (n < 0) n = 0;
    if (n > 255) n = 255;

    // Wert an Arduino senden
    port.write(String(n) + '\n', (err) => {
      if (err) {
        console.log('❌ Fehler beim Schreiben auf Seriell:', err.message);
      } else {
        console.log('✅ Wert an Arduino gesendet:', n);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('❎ Browser getrennt');
  });
});

// === 4) Server starten ===
const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
