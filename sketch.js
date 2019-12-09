const HOST = 'localhost';
const PORT = 42069;
// Settings for serving

// Create variable to collect sensor data from Arduino
let sensorLevel;

// Create a new websocket
const socket = new window.WebSocket("ws://" + HOST + ":" + PORT);
// When we get new data, parse it as JSON
socket.onmessage = message => {
    try {
        data = JSON.parse(message.data);
        // Collect Sensor Data and attribute to variable
        sensorLevel = data.data;

    } catch (err) {
        console.error(err);
    }
};
socket.onclose = () => {
    console.warn("WebSocket closed, no longer receiving data.");
    data = null;
};

console.log(socket);

// assemble prerequisites
const canvasSketch = require("canvas-sketch");
const triangulate = require("delaunay-triangulate");
var colors = require('nice-color-palettes')
const Tone = require("tone");
const AudioEnergy = require("./AudioEnergy");
const coolRandom = require("canvas-sketch-util/random");
const p5 = require("p5");

new p5();

// Set variables for AudioEnergy.js
let mic, analyser;

// variables for circles/points to construct circles
let innerPoints, outerPoints;
let circleRadius;
let fillColor;

let cells;
let circleCells = [];

// for radius of mask
let r;

// variable for line drawing increment
let increment = 10;

// arrays to contain moving gridlines
let mLines = [];
let cLines = [];

// arrays to contain moving bars
let lblobs = [];
let rblobs = [];

// array for points of circles
let circlePoints = [];

// cap for line drawing
let lineLimit = 500;

// set Interval for moving bar generation
let barInterval = 1000 / 3;

// initialise colour pallette
var listOfColors = colors[Math.floor(Math.random() * colors.length)];
let color1 = color(listOfColors[0]);
let color2 = color(listOfColors[1]);

// variables for color attribution
let rainColor;
let lineColor;
let haloColor;

// variables for globally transmitting AudioEnergy of various freqs
let scale, midScale, trebleScale, highMidScale, lowMidScale;

// variable for test of silence
let silence, previousSilence;

//toggle state for displaying helper text
let helpText = 1;

// default blend mode for mask
let crazyFrame = 0;

// optionally initialise sensor peak at initial sensor level
let maxSensor;

const settings = {
    p5: true,
    dimensions: [2048, 2048],
    animate: true
};

// Equivalent of p5 "Setup"
const sketch = ({ width, height }) => {

    // default circle drawing values
    innerPoints = 10;
    outerPoints = 20;
    circleRadius = 1000;

    // initial color selection from pallette
    sidesColor = color(random(listOfColors));
    rainColor = color(random(listOfColors));
    lineColor = color(random(listOfColors));

    //draw splash screen
    background(0);
    fill(color(listOfColors[0]));
    ellipse(width / 2, height / 2, width);
    push();
    textSize(width / 6);
    textAlign(CENTER);
    fill(color(listOfColors[1]));
    text("ARCTAn", width / 2, height - 60);
    pop();
    drawHelperText();

    // create 9 empty arrays for points in/on circle
    for (let j = 0; j < 9; j++) {
        circlePoints[j] = new Array(innerPoints + outerPoints).fill(0).map(() => {
        });
    }

    // initialise 9 sets of points for drawing up to 9 circles & set intervals for timed functions
    individualPoints();
    setInterval(addBar, barInterval);
    setInterval(checkSilence, 500);
    setInterval(enumeratePoints, 1000);
    setInterval(addLine, 1000 / 3);

    // Equivalent of p5 "Draw" loop
    return ({ context, width, height }) => {

        // check if analyser is present
        if (!analyser) {
            return;
        }
        // console.log(points);
        background(0, 200);

        //pass audio to the analyser
        analyser.update();

        //isolate frequencies for use in sketch
        const kick = analyser.getEnergy("bass");
        const treble = analyser.getEnergy("treble");
        const mids = analyser.getEnergy("mid");
        const highMid = analyser.getEnergy("highMid");
        const lowMid = analyser.getEnergy("lowMid");

        //remap for use in sketch with tuned dB levels
        scale = map(kick, -60, -30, 0.1, 1, true);
        trebleScale = map(treble, -100, -60, 0.1, 1, true);
        midScale = map(mids, -100, -30, 0.1, 1, true);
        highMidScale = map(highMid, -100, -30, 0.1, 1, true);
        lowMidScale = map(lowMid, -100, -30, 0.1, 1, true);

        // collect added lines and draw
        drawbgLines(increment, lineColor);

        // collect bars and draw
        drawBar();

        // modify radius according to bass/kick information each frame...
        circleRadius = scale * (width / 3);

        // ... and also attribute to central 'halo' size
        drawHalo(circleRadius, scale);

        // draw gradient
        setGradient(0, 0, width, height, color1, color2, "Y");

        // call point generation function
        individualPoints();

        // modify line increment with mouse position (used for debugging)
        increment += mouseX / 10;

        // draw 'rain' using treble information
        drawRain(trebleScale, rainColor);

        // draw overall mask
        drawFrame();

        // when toggle is active, show help text
        if (helpText == 1) {
            drawHelperText();
        }

    };
};

// --------------------- //
// FUNCTION DECLARATIONS //
// --------------------- //

// randomly choose number of points to describe circles
function enumeratePoints() {
    innerPoints = random(100, 200);
    outerPoints = random(3, 200);
}

// check if silence is longer than interval at which it is checked; if so, change color pallette
function checkSilence() {

    if (midScale == 0.1) {
        silence = true;
    }
    else {
        silence = false;
    }

    if (previousSilence == true && silence == true) {

        changePallette();

    }

    if (silence == true) {
        previousSilence = true;
    }
    else {
        previousSilence = false;
    }

}

// get new color pallette from list
function changePallette() {

    //change pallette
    listOfColors = colors[Math.floor(Math.random() * colors.length)];
    color1 = color(listOfColors[0]);
    color2 = color(listOfColors[1]);

    // and apply to objects
    sidesColor = color(random(listOfColors));
    rainColor = color(random(listOfColors));
    lineColor = color(random(listOfColors));

}

// generate 9 sets of points using random in/on circle (getIndividualPoints)
function individualPoints() {
    for (let j = 0; j < 9; j++) {

        // parameters for ring on which circles are drawn and offset for drawing each circle on this ring
        let cx = width / 2;
        let cy = height / 2;
        let ringRadius = width / 3;
        let df = 10000;
        let offset = (TWO_PI / 6) * df;


        // give each circle a constantly changing position, as well as attributing a scale factor from a frequency band to each
        if (j < 1) {
            // specify moving center of each circle as time elapses
            let a = (millis() + (offset * 0)) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, midScale);

        }
        else if (j < 2) {
            // generated but not used in this version
            getIndividualPoints(width * 3 / 6, height * 1 / 6, j, trebleScale);
        }
        else if (j < 3) {
            let a = (millis() + offset * 1) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, highMidScale);
        }
        else if (j < 4) {
            let a = (millis() + offset * 2) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, trebleScale);
        }
        else if (j < 5) {
            //CENTRAL 'STATIC' CIRCLE
            getIndividualPoints(width * 3 / 6, height * 3 / 6, j, scale);
        }
        else if (j < 6) {
            let a = (millis() + offset * 3) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, midScale);
        }
        else if (j < 7) {
            let a = (millis() + offset * 4) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, highMidScale);
        }
        else if (j < 8) {
            //generated but not used in this version
            getIndividualPoints(width * 3 / 6, height * 5 / 6, j, trebleScale);
        }
        else if (j < 9) {
            let a = (millis() + offset * 5) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, trebleScale);
        }
    }

    // loop these positions and draw each circle
    for (let j = 0; j < 9; j++) {

        if (j == 1 || j == 7) {
            // don't draw these
        }
        else {
            drawIndividualCircle(scale, circleCells[j], j);
        }
    }


}

// function called for each circle to fill each array with random points in/on circle
function getIndividualPoints(circleX, circleY, j, scale) {

    // modify circle radius on/in which points are selected according to kick/bass information
    circleRadius = 2 * scale * (width / 12);

    // fill arrays with points and remove old ones
    for (let i = 0; i < innerPoints; i++) {
        circlePoints[j].shift();
        [x, y] = coolRandom.insideCircle(radius = circleRadius);
        circlePoints[j].push([x + circleX, y + circleY])
    }

    for (let i = 0; i < outerPoints; i++) {
        circlePoints[j].splice(0, 1);
        [x, y] = coolRandom.onCircle(radius = circleRadius);
        circlePoints[j].push([x + circleX, y + circleY])
    }

    // use triangulate to create cells between these points
    circleCells[j] = triangulate(circlePoints[j]);

}

// function to actually draw each circle
function drawIndividualCircle(scale, arrayData, j) {

    // iterate through cells (triangles), collect each point, choose a random color from the pallette and draw a triangle for each cell in that color
    for (let i = 0; i < arrayData.length; i++) {
        const cell = arrayData[i];

        const index0 = cell[0];
        const index1 = cell[1];
        const index2 = cell[2];

        const point0 = circlePoints[j][index0];
        const point1 = circlePoints[j][index1];
        const point2 = circlePoints[j][index2];

        stroke("black");
        strokeWeight(1);

        fillColor = random(listOfColors);
        fill(fillColor);

        triangle(
            point0[0],
            point0[1],
            point1[0],
            point1[1],
            point2[0],
            point2[1]
        );

    }

}

// function for time based addition of vertical bars on left and right
function addBar() {

    // initialise y position
    let y = height * 1 / 2;

    // push a new object into each array with initial properties
    const rblobData = {
        startx: (width * 6 / 10) + 200,
        starty: y,
        width: 10,
        height: 350,
        colour: color(random(listOfColors))
    }

    const lblobData = {
        startx: (width * 4 / 10) - 200,
        starty: y,
        width: 10,
        height: 350,
        colour: color(random(listOfColors))

    }

    rblobs.push(rblobData);
    lblobs.push(lblobData);

}

// function to actually draw arrays of bars
function drawBar() {

    //draw bars
    for (let i = 0; i < rblobs.length; i++) {
        //create new bar at current array pos
        const blob = rblobs[i];

        //delete oldest bar when limit is reached
        if (rblobs.length > lineLimit) {
            rblobs.shift();
        }
        //delete current bar if offscreen
        if (blob.startx > width + blob.size) {
            rblobs.splice(i, 1);
        }

        // draw
        noStroke();
        fill(blob.colour);
        rectMode(CENTER);
        rect(blob.startx, blob.starty, blob.width, blob.height);

        // modify position
        blob.startx += 10;
        blob.width += 1;
        blob.height += 20;
    }


    for (let i = 0; i < lblobs.length; i++) {
        //create new blob at current array pos
        const blob = lblobs[i];

        //delete oldest blob when limit is reached
        if (lblobs.length > lineLimit) {
            lblobs.shift();
        }
        //delete current blob if offscreen
        if (blob.startx > width + blob.size) {
            lblobs.splice(i, 1);
        }


        noStroke();
        let colour = random(["cyan", "magenta"]);
        fill(blob.colour);
        rectMode(CENTER);
        rect(blob.startx, blob.starty, blob.width, blob.height);


        blob.startx -= 10;
        blob.width += 1;
        blob.height += 20;
    }

}

// function for drawing 'rain' based on treble information
function drawRain(trebleScale, rainColor) {

    // scatter rain randomly, drawing more when trebleScale is higher
    for (let i = 0; i < 50 * trebleScale; i++) {
        let sx = random(0, width);
        let sy = random(0, height);
        push();
        stroke(rainColor);
        // and thicker when trebleScale is higher
        strokeWeight(10 * trebleScale);
        line(sx, sy, sx, sy + 20);
        pop();
    }

}

// simple ellipse drawing function using kick/bass information and modulating opacity with time
function drawHalo(circleRadius) {

    push();
    noStroke();
    blendMode(DIFFERENCE);
    haloColor = color(listOfColors[4]);
    haloColor.setAlpha(200 - (128 * sin(millis() / 1200)));
    fill(haloColor);
    ellipse(width / 2, height / 2, circleRadius * 3, circleRadius * 3);
    pop();

}

// function for actually drawing grid lines from array
// 'increment' left as argument for debugging with mouse pos
function drawbgLines(increment, lineColor) {

    //draw static 'verticals' in grid
    const numLines = 15;

    for (let i = 0; i < numLines + 1; i++) {
        push();
        stroke(lineColor);
        line(width / 2, height / 2, i * width / numLines, height);
        pop();
    }


    //draw horizontals
    for (let i = 0; i < mLines.length; i++) {
        //create new line at current array pos
        const mLine = mLines[i];
        //delete oldest line when limit is reached
        if (mLines.length > lineLimit) {
            mLines.shift();
        }
        //delete current line if offscreen
        if (mLine.startxy > height) {
            mLines.splice(i, 1);
        }
        //draw line with startxy property
        push();
        stroke(lineColor);
        strokeWeight(4);
        line(mLine.startxy, mLine.startxy, width - mLine.startxy, mLine.startxy);
        pop();
        //increment startxy using direction property, use mouseX if Arduino not connected
        if (sensorLevel != null) {
            mLine.startxy += pow(mLine.direction, 4 * sensorLevel / 1023);
        }
        else {
            mLine.startxy += pow(mLine.direction, 4 * mouseX / width);
        }

    }

    // draw 'horizon' rectangle
    push();
    noStroke();
    fill(0);
    rectMode(CORNERS);
    rect(0, 0, width, 3 * height / 5);
    pop();

}

// function for adding horizontal lines to arrays (cLines array deprecated but kept for optionally using two colours)
function addLine() {

    let direction = 2;

    const cLineData = {
        startxy: width / 2,
        direction: direction
    }

    const mLineData = {
        startxy: width / 2,
        direction: direction
    }

    cLines.push(cLineData);
    mLines.push(mLineData);

}

// function for drawing 'mask'
function drawFrame() {

    push();

    // flag select for toggling between frame modes
    noStroke();
    if (crazyFrame == 0) {
        blendMode(BLEND);
        fill(0);
    }
    else {
        blendMode(DIFFERENCE);
        fill(255);
    }

    // draw outer shape (rectangle) using beginShape to allow for use of beginContour to 'remove' shape of aperture
    beginShape();
    vertex(0, 0);
    vertex(width, 0);
    vertex(width, height);
    vertex(0, height);

    // begin drawing aperture
    beginContour();

    // use sensor data from arduino to define contour (hole) size unless disconnected (use mouseX)
    if (sensorLevel != null) {
        r = map(sensorLevel, 0, maxLevel, 0, width / 2, true);
        sf = map(sensorLevel, 0, maxLevel, 3, 13, true);
    }
    else {
        r = map(mouseX, 0, width, 0, width / 2);
        sf = map(mouseX, 0, width, 3, 18, true);
    }

    // iterate drawing of vertices using radius, N/sf as number of sides, and from center of canvas
    let N = sf;
    for (var i = 0; i <= N; i++) {
        vertex(r * cos(-i * 2 * PI / N) + width / 2, r * sin(-i * 2 * PI / N) + height / 2);
    }

    endContour();
    endShape();
    pop();
}

// function to produce gradient for background
// only Y version is used
function setGradient(x, y, w, h, c1, c2, axis) {
    noFill();
    if (axis == "Y") {  // Top to bottom gradient
        for (let i = y; i <= y + h; i++) {
            var inter = map(i, y, y + h, 0, 1);
            var c = lerpColor(c1, c2, inter);
            stroke(c);
            line(x, i, x + w, i);
        }
    }
    else if (axis == "X") {  // Left to right gradient
        for (let j = x; j <= x + w; j++) {
            var inter2 = map(j, x, x + w, 0, 1);
            var d = lerpColor(c1, c2, inter2);
            stroke(d);
            line(j, y, j, y + h);
        }
    }
}

// function to (optionally) draw help text shown on splash screen
function drawHelperText() {

    push();
    blendMode(DIFFERENCE);
    fill(255);
    textAlign(CENTER);
    textSize(20);
    let s1 = "click: enable/disable mic | h: show/hide help | →: change pallette | f: frame mode | © Stephen Henderson 2019";
    text(s1, width / 2, height - 20);
    pop();

}

// base operation functions defined using window. to work inside canvas-sketch context
window.mousePressed = mousePressed;
function mousePressed() {

    // if mic is found, click will stop audio and write to console
    if (mic) {
        console.log("Disposing of Mic:", mic.label);
        // stop recording
        mic.dispose();
        // Clear mic so we can create another on next click
        mic = null;
    } else {

        // begin Tone.js
        Tone.start();

        // use current sensor level as maximum
        // this gives option to initialise with ambient light conditions and run sketch thereafter
        // absolute values used instead later
        maxSensor = sensorLevel;

        // Create a new mic
        mic = new Tone.UserMedia();

        // open it asks for user permission
        mic.open();

        // Create an analyser node 
        analyser = new AudioEnergy();
        analyser.smoothing = 0.4;

        // Connect with analyser as well so we can detect waveform
        mic.connect(analyser);

        // optionally connect to the master to hear audio input
        // mic.connect(Tone.Master);

        console.log("Opened Microphone");
    }
}

// right arrow is a special dude, so gets its own function - map to pallette change function
window.keyPressed = keyPressed;
function keyPressed() {

    if (keyCode === RIGHT_ARROW) {
        changePallette();
    }

}

// other keys use keyTyped and call functions shown in helper text
window.keyTyped = keyTyped;
function keyTyped() {

    // toggle help text
    if (key === 'h') {
        if (helpText == 0) {
            helpText = 1;
        }
        else {
            helpText = 0;
        }
    }

    // toggle mask blending mode
    if (key === 'f') {
        if (crazyFrame == 0) {
            crazyFrame = 1;
        }
        else {
            crazyFrame = 0;
        }
    }

}

// the whole thing is pushed into canvas sketch with the settings specified at the top of the code
canvasSketch(sketch, settings);
// line 745: code golf winner 2019