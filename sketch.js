const HOST = 'localhost';
const PORT = 42069;

// Create variable to collect sensor data from Arduino
let sensorLevel;

// Create a new websocket
const socket = new window.WebSocket("ws://" + HOST + ":" + PORT);
// When we get new data, parse it as JSON
socket.onmessage = message => {
    try {
        data = JSON.parse(message.data);
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
let points;
let innerPoints, outerPoints;
let circleRadius;
let circleX, circleY;
let fillColor;

let cells;
let circleCells = [];

// for radius of mask
let r;

let increment = 10;

let cyanlines = new Array(100);

// arrays to contain moving gridlines
let mLines = [];
let cLines = [];

// arrays to contain moving bars
let lblobs = [];
let rblobs = [];

let circlePoints = [];

let lineLimit = 500;

// set Interval for moving bar generation
let barInterval = 1000 / 3;

// initialise colour pallette
var listOfColors = colors[Math.floor(Math.random() * colors.length)];
let color1 = color(listOfColors[0]);
let color2 = color(listOfColors[1]);

let sidesColor;
let rainColor;
let lineColor;
let haloColor;

// variables for globally transmitting AudioEnergy of various freqs
let scale, midScale, trebleScale, highMidScale, lowMidScale;

let silence, previousSilence;

//toggle state for displaying helper text
let helpText = 1;

// default blend mode for mask
let crazyFrame = 0;

// initialise sensor peak at initial sensor level
let maxSensor;

const settings = {
    p5: true,
    dimensions: [2048, 2048],
    animate: true
};

// Equivalent of p5 "Setup"
const sketch = ({ width, height }) => {

    innerPoints = 10;
    outerPoints = 20;
    circleRadius = 1000;

    sidesColor = color(random(listOfColors));
    rainColor = color(random(listOfColors));
    lineColor = color(random(listOfColors));

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

    points = new Array(innerPoints + outerPoints).fill(0).map(() => {
        // // return [Math.random() * width, Math.random() * height];
        // [x, y] = coolRandom.insideCircle(radius = circleRadius);
        // return [x + circleX, y + circleY];

    });


    for (let j = 0; j < 9; j++) {
        circlePoints[j] = new Array(innerPoints + outerPoints).fill(0).map(() => {
        });

    }

    individualPoints();
    setInterval(addBar, barInterval);
    setInterval(checkSilence, 500);
    setInterval(enumeratePoints, 1000);
    setInterval(addLine, 1000 / 3);

    // Equivalent of p5 "Draw" loop
    return ({ context, width, height }) => {

        if (!analyser) {

            return;
        }
        // console.log(points);
        background(0, 200);

        //pass audio to the analyser
        analyser.update();

        //isolate frequency for use in sketch
        const kick = analyser.getEnergy("bass");
        const treble = analyser.getEnergy("treble");
        const mids = analyser.getEnergy("mid");
        const highMid = analyser.getEnergy("highMid");
        const lowMid = analyser.getEnergy("lowMid");

        //remap to 0-1
        scale = map(kick, -60, -30, 0.1, 1, true);
        trebleScale = map(treble, -100, -60, 0.1, 1, true);
        midScale = map(mids, -100, -30, 0.1, 1, true);
        highMidScale = map(highMid, -100, -30, 0.1, 1, true);
        lowMidScale = map(lowMid, -100, -30, 0.1, 1, true);

        drawbgLines(increment, lineColor);

        drawBar();

        circleRadius = scale * (width / 3);

        drawHalo(circleRadius, scale);

        setGradient(0, 0, width, height, color1, color2, "Y");

        individualPoints();

        increment += mouseX / 10;

        drawRain(trebleScale, rainColor);

        drawFrame();

        if (helpText == 1) {
            drawHelperText();
        }

    };
};

// --------------------- //
// FUNCTION DECLARATIONS //
// --------------------- //

function enumeratePoints() {

    innerPoints = random(100, 200);
    outerPoints = random(3, 200);

}

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

function changePallette() {
    //change pallette
    listOfColors = colors[Math.floor(Math.random() * colors.length)];
    color1 = color(listOfColors[0]);
    color2 = color(listOfColors[1]);

    sidesColor = color(random(listOfColors));
    rainColor = color(random(listOfColors));
    lineColor = color(random(listOfColors));

}

function individualPoints() {
    for (let j = 0; j < 9; j++) {

        let cx = width / 2;
        let cy = height / 2;
        let ringRadius = width / 3;
        let df = 10000;
        let offset = (TWO_PI / 6) * df;


        if (j < 1) {
            // original (static) for backup
            // getIndividualPoints(width * 2 / 6, height * 1 / 6, j, midScale);

            let a = (millis() + (offset * 0)) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, midScale);

        }
        else if (j < 2) {
            // generated but not used
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
            //CENTRAL STATIC
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
            //generated but not used
            getIndividualPoints(width * 3 / 6, height * 5 / 6, j, trebleScale);
        }
        else if (j < 9) {
            let a = (millis() + offset * 5) / df % TWO_PI;
            x = cx + cos(a) * ringRadius;
            y = cy + sin(a) * ringRadius;
            getIndividualPoints(x, y, j, trebleScale);
        }
    }

    for (let j = 0; j < 9; j++) {

        if (j == 1 || j == 7) {
            // console.log(j);
        }
        else {
            drawIndividualCircle(scale, circleCells[j], j);
        }
    }


}

function getIndividualPoints(circleX, circleY, j, scale) {

    circleRadius = 2 * scale * (width / 12);
    // innerPoints = 100;
    // outerPoints = 200;

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

    circleCells[j] = triangulate(circlePoints[j]);

}

function drawIndividualCircle(scale, arrayData, j) {

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

function newPoints() {

    // changePoints(width / 2, height / 2);

}

function changePoints(circleX, circleY) {

    for (let i = 0; i < innerPoints; i++) {
        points.shift();
        [x, y] = coolRandom.insideCircle(radius = circleRadius);
        points.push([x + circleX, y + circleY])
    }

    for (let i = 0; i < outerPoints; i++) {
        points.splice(0, 1);
        [x, y] = coolRandom.onCircle(radius = circleRadius);
        points.push([x + circleX, y + circleY])
    }

    cells = triangulate(points);


}

function drawCircle(scale) {

    innerPoints = 100 * scale;
    outerPoints = 20 * scale;

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const index0 = cell[0];
        const index1 = cell[1];
        const index2 = cell[2];

        const point0 = points[index0];
        const point1 = points[index1];
        const point2 = points[index2];

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

function addBar() {

    // let y = random(height * 1 / 3, height * 2 / 3);
    let y = height * 1 / 2;

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

function drawBar() {

    //draw blobs
    for (let i = 0; i < rblobs.length; i++) {
        //create new blob at current array pos
        const blob = rblobs[i];

        //delete oldest blob when limit is reached
        if (rblobs.length > lineLimit) {
            rblobs.shift();
        }
        //delete current blob if offscreen
        if (blob.startx > width + blob.size) {
            rblobs.splice(i, 1);
        }


        noStroke();
        fill(blob.colour);
        rectMode(CENTER);
        rect(blob.startx, blob.starty, blob.width, blob.height);


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

function drawRain(trebleScale, rainColor) {

    for (let i = 0; i < 50 * trebleScale; i++) {
        let sx = random(0, width);
        let sy = random(0, height);
        push();
        stroke(rainColor);
        strokeWeight(10 * trebleScale);
        line(sx, sy, sx, sy + 20);
        pop();
    }

}

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

function drawbgLines(increment, lineColor) {

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


    push();
    noStroke();
    fill(0);
    rectMode(CORNERS);
    rect(0, 0, width, 3 * height / 5);
    pop();

}

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

function drawFrame() {

    push();

    noStroke();
    if (crazyFrame == 0) {
        blendMode(BLEND);
        fill(0);
    }
    else {
        blendMode(DIFFERENCE);
        fill(255);
    }
    beginShape();
    vertex(0, 0);
    vertex(width, 0);
    vertex(width, height);
    vertex(0, height);

    beginContour();

    // use sensor data from arduino to define contour (hole) size unless disconnected
    if (sensorLevel != null) {
        r = map(sensorLevel, 1023, maxSensor, 0, width / 2, true);
        sf = map(sensorLevel, 1023, maxSensor, 3, 13, true);
        console.log(sensorLevel);
    }
    else {
        r = map(mouseX, 0, width, 0, width / 2);
        sf = map(mouseX, 0, width, 3, 18, true);
    }

    let N = sf;
    for (var i = 0; i <= N; i++) {
        vertex(r * cos(-i * 2 * PI / N) + width / 2, r * sin(-i * 2 * PI / N) + height / 2);
    }
    endContour();

    endShape();
    pop();


}

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

function drawHills() {

    push();
    noStroke();
    fill(color2);

    ellipse(width, height * 3 / 5, width * 4 / 5, width * 3 / 5);
    ellipse(0, height * 3 / 5, width * 4 / 5, width * 3 / 5);

    pop();
}

function drawSides(scale, sidesColor) {

    push();
    fill(sidesColor);
    noStroke();

    // blendMode(DIFFERENCE);

    beginShape();
    vertex(width, 0 + 400 - (scale * 200));
    vertex(width, height * 3 / 5);
    vertex(width * 4 / 5, (height * 3 / 5));
    // vertex(width * 3 / 5, (height * 3 / 9) + 400 - (scale * 200));
    endShape();

    beginShape();
    vertex(0, 0 + 400 - (scale * 200));
    vertex(0, height * 3 / 5);
    vertex(width * 1 / 5, height * 3 / 5);
    // vertex(width * 2 / 5, height * 3 / 9 + 400 - (scale*200));
    endShape();

    pop();

}

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

window.mousePressed = mousePressed;
function mousePressed() {

    // console.log("hello");

    if (mic) {

        console.log("Disposing of Mic:", mic.label);


        // push();
        // rectMode(CENTER);
        // fill("white");
        // rect(width / 2, height / 2, 100, 100);
        // pop();

        // stop recording
        mic.dispose();
        // Clear mic so we can create another on next click
        mic = null;
    } else {
        Tone.start();


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

window.keyPressed = keyPressed;
function keyPressed() {

    if (keyCode === RIGHT_ARROW) {
        changePallette();
    }

}

window.keyTyped = keyTyped;
function keyTyped() {

    if (key === 'h') {
        if (helpText == 0) {
            helpText = 1;
        }
        else {
            helpText = 0;
        }
    }

    if (key === 'f') {
        if (crazyFrame == 0) {
            crazyFrame = 1;
        }
        else {
            crazyFrame = 0;
        }
    }

}

canvasSketch(sketch, settings);