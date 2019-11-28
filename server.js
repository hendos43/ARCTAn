const HOST = "10.97.5.172";
const PORT = 32045;

const WebSocket = require("ws");
const wss = new WebSocket.Server({ host: HOST, port: PORT });



let newData;

// ---
// somehow get newData from serialport
// ---

// Require the serialport node module
var SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')



var port = new SerialPort("COM4", {
    baudRate: 9600,
});// Read the port data
const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
parser.on('data', function (data) {
    // console.log(data);
    newData = parseInt(data);
})
// ---
// send to websocket clients
// ---

setInterval(update, 1000 / 30);

function update() {
    const obj = {
        data: newData
    };
    const str = JSON.stringify(obj);
    const clients = Array.from(wss.clients);

    // console.log(clients.length);


    for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        client.send(str);
    }
}


