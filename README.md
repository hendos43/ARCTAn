# ARCTAn
Audio Reactive Circles Triangulated with Arduino iNput

### Warning: Messy and unmaintained


## Installation

### Prerequisites

1. You will need to use electron and canvas-sketch for this code to work
2. You will also have the Arduino IDE installed or some way to upload code to the Arduino which will feed the sketch sensor data
3. You will need node/npm and to use either cmder (or another terminal emulator), or terminal
4. Visual Studio (for electron)

### Setup
1. Download the project and unzip
2. Upload the example code sketch `Smoothing.ino` from the `arduino` folder to any Arduino 
3. Connect light sensor to A0 as shown below:

![fritzing](https://github.com/hendos43/ARCTAn/blob/master/arduino/LDR_Arduino_A0_10K.jpg)

4. Make a note of which COM port your Arduino is connected to, and amend it in `server.js` on line 4. Information from the LDR will be communicated via Serial.
5. Open a cmder window (or terminal on Mac) and navigate to the folder you unzipped in Step 1. e.g.:

`cd C:\Users\Me\ARCTAn`

6. Run an electron server to collect the serial data and pass it to `sketch.js` by running:

`npx electron server.js`

7. Open a new terminal window and navigate again to the ARCTAn folder
8. Now you can run the sketch using:

`canvas-sketch sketch.js`

9. Copy the link given to you in cmder by canvas-sketch and paste into your web browser, complete with the port. Click to allow access to the computer's microphone which can be set in the ordinary way to external soundcard/line-in/stereo mix (for example) to collect audio to drive the sketch.
10. Keep on rockin' in the free world

### Troubleshooting

In Chrome, you may have to allow the ability to access to your microphone when connected to a locally hosted file. To do this, go to:
`chrome://flags/#unsafely-treat-insecure-origin-as-secure`
enable, and add the URL and port you are served by `canvas-sketch` into the box. You will need to restart Chrome.
