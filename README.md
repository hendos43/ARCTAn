# AudioBlobs

## Installation

### Prerequisites

1. You will need to use electron and canvas-sketch for this code to work
2. You will also have the Arduino IDE installed or some way to upload code to the Arduino which will feed the sketch sensor data

### Setup
1. Download the project and unzip
2. Upload the example code sketch `Smoothing.ino` from the `arduino` folder to any Arduino 
3. Connect light sensor to A0 as shown below:

![fritzing](https://github.com/hendos43/AudioBlobs/blob/master/arduino/LDR_Arduino_A0_10K.jpg)

4. Make a note of which COM port your Arduino is connected to, and amend it in `server.js` on line 4. Information from the LDR will be communicated via Serial.
5. Open a cmder window (or terminal on Mac) and navigate to the folder you unzipped in Step 1. e.g.:

`cd C:\Users\Me\AudioBlobs`

6. Run an electron server to collect the serial data and pass it to `sketch.js` by running:

`npx electron server.js`

7. Open a new terminal window and navigate again to the AudioBlobs folder
8. Now you can run the sketch using:

`canvas-sketch sketch.js`

9. Copy the link given to you in cmder by canvas-sketch and paste into your web browser, complete with the port. Click to allow access to the computer's microphone which can be set in the ordinary way to external soundcard/line-in/stereo mix (for example) to collect audio to drive the sketch.
10. Keep on rockin' in the free world
