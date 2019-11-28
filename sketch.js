const HOST = '10.97.5.172';
const PORT = 32045;

let lightLevel;

// Create a new websocket
const socket = new window.WebSocket("ws://" + HOST + ":" + PORT);
// When we get new data, parse it as JSON
socket.onmessage = message => {
    try {
        data = JSON.parse(message.data);
        lightLevel = data.data;
        // console.log(lightLevel);
    } catch (err) {
        console.error(err);
    }
};
socket.onclose = () => {
    console.warn("WebSocket closed, no longer receiving data.");
    data = null;
};

console.log(socket);

const canvasSketch = require("canvas-sketch");
const triangulate = require("delaunay-triangulate");

const risoColors = require("riso-colors");
var colors = require('nice-color-palettes')

const Tone = require("tone");
const AudioEnergy = require("./AudioEnergy");
const coolRandom = require("canvas-sketch-util/random");

const p5 = require("p5");

new p5();

let mic, analyser;

let points;

let innerPoints, outerPoints;

let circleRadius;
let circleX, circleY;

let fillColor;

let xoff;

let cells;
let circleCells = [];

let pg;

let xy;

let increment = 10;

let cyanlines = new Array(100);

let mLines = [];

let cLines = [];

let lblobs = [];
let rblobs = [];

let circlePoints = [];

let lineLimit = 500;

let blobInterval;

// var listOfColors = colors[random(0, colors.length)];
var listOfColors = colors[Math.floor(Math.random() * colors.length)];

// console.log(colors[0]);
// console.log(colors.length);
// console.log(listOfColors);

let color1 = color(listOfColors[0]);
let color2 = color(listOfColors[1]);
// console.log(color1);
// console.log(color2);

let sidesColor;
let rainColor;
let lineColor;
let haloColor;

const settings = {
    p5: true,
    dimensions: [2048, 2048],
    animate: true
};

// Equivalent of p5 "Setup"
const sketch = ({ width, height }) => {

    innerPoints = 100;
    outerPoints = 20;
    circleRadius = 1000;

    sidesColor = color(random(listOfColors));
    rainColor = color(random(listOfColors));
    lineColor = color(random(listOfColors));

    points = new Array(innerPoints + outerPoints).fill(0).map(() => {
        // // return [Math.random() * width, Math.random() * height];
        // [x, y] = coolRandom.insideCircle(radius = circleRadius);
        // return [x + circleX, y + circleY];

    });

    // for (let i = 0; i < outerPoints; i++) {
    //     [x, y] = coolRandom.onCircle(radius = circleRadius);
    //     points.push([x + circleX, y + circleY]);
    // }

    // cells = triangulate(points);

    // newPoints();

    for (let j = 0; j < 9; j++) {
        circlePoints[j] = new Array(innerPoints + outerPoints).fill(0).map(() => {
        });

        // circleCells[j] = new Array(200).fill(0).map(() => {
        // });
    }



    const changeInterval = 1000 / 30;
    individualPoints();

    // setInterval(individualPoints, changeInterval);
    // setInterval(addLine, 300);
    // setInterval(addBlob, 600);


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

        const scale = map(kick, -60, -30, 0.2, 1, true);
        const trebleScale = map(treble, -100, -60, 0, 1, true);

        drawbgLines(increment, lineColor);

        // setGradient(0, 0, width, 3 * height / 5, color1, color2, "Y");

        // drawSides(scale, sidesColor);

        // drawHills();

        // drawBlobs();

        circleRadius = scale * (width / 2);

        // drawHalo(circleRadius, scale);

        // drawCircle(scale);

        setGradient(0, 0, width, height, color1, color2, "Y");

        individualPoints(scale);


        // drawIndividualCircle(scale);



        // drawRain(trebleScale, rainColor);

        increment += mouseX / 10;


    };
};

function individualPoints(scale) {
    for (let j = 0; j < 9; j++) {


        if (j < 1) {
            getIndividualPoints(width * 1 / 6, height * 1 / 6, j, scale);
        }
        else if (j < 2) {
            getIndividualPoints(width * 3 / 6, height * 1 / 6, j, scale);
        }
        else if (j < 3) {
            getIndividualPoints(width * 5 / 6, height * 1 / 6, j, scale);

        }
        else if (j < 4) {
            getIndividualPoints(width * 1 / 6, height * 3 / 6, j, scale);
        }
        else if (j < 5) {
            getIndividualPoints(width * 3 / 6, height * 3 / 6, j, scale);

        }
        else if (j < 6) {
            getIndividualPoints(width * 5 / 6, height * 3 / 6, j, scale);
        }
        else if (j < 7) {
            getIndividualPoints(width * 1 / 6, height * 5 / 6, j, scale);

        }
        else if (j < 8) {
            getIndividualPoints(width * 3 / 6, height * 5 / 6, j, scale);
        }
        else if (j < 9) {
            getIndividualPoints(width * 5 / 6, height * 5 / 6, j, scale);

        }






        // getIndividualPoints(width * 2 / 3, height / 2);

        //  console.log(circleCells[j]);
    }

    for (let j = 0; j < 9; j++) {

        drawIndividualCircle(scale, circleCells[j], j);
    }


}

function getIndividualPoints(circleX, circleY, j, scale) {

    circleRadius = 2* scale * (width / 9);


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

    // console.log(circleCells[j]);

}

function drawIndividualCircle(scale, fuck, j) {

    // console.log(fuck);

    innerPoints = 100 * scale;
    outerPoints = 20 * scale;


    for (let i = 0; i < fuck.length; i++) {
        const cell = fuck[i];

        // console.log(cell);

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

    // console.log("complete");

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

function addBlob() {

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

function drawBlobs() {

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
    haloColor = color(listOfColors[4]);
    haloColor.setAlpha(200 - (128 * sin(millis() / 1200)));
    fill(haloColor);
    ellipse(width / 2, height * 2 / 5, circleRadius * 3, circleRadius * 3);
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


    // for (let i = 0; i < numLines + 1; i++) {
    //     push();
    //     stroke("cyan");
    //     line(width / 2, height / 2, i * width / numLines, 0);
    //     pop();

    // }


    // for (let i = 0; i < numLines + 1; i++) {

    //     let radius = 2000;
    //     let angle = PI * (i / numLines);
    //     let sx = width / 2;
    //     let sy = height / 2;

    //     let ex = sx + cos(angle) * radius;
    //     let ey = sy + sin(angle) * radius;

    //     push();
    //     stroke("magenta");
    //     strokeWeight(2);
    //     line(sx, sy, ex, ey);
    //     pop();


    // }


    // for (let i = 0; i < numLines + 1; i++) {

    //     let radius = 2000;
    //     let angle = TWO_PI * (i / numLines);
    //     let sx = width / 2;
    //     let sy = height / 2;

    //     let ex = sx + cos(angle) * radius;
    //     let ey = sy + sin(angle) * radius;

    //     push();
    //     stroke("cyan");
    //     line(sx, sy, ex, ey);
    //     pop();


    // }




    //draw magenta horizontals
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
        //increment startxy using direction property
        mLine.startxy += pow(mLine.direction, 4 * mouseX / width);
    }


    // //draw cyan horizontals
    // for (let i = 0; i < cLines.length; i++) {
    //     //create new line at current array pos
    //     const cLine = cLines[i];
    //     //delete oldest line when limit is reached
    //     if (cLines.length > lineLimit) {
    //         cLines.shift();
    //     }
    //     //delete current line if offscreen
    //     if (cLine.startxy > height) {
    //         cLines.splice(i, 1);
    //     }
    //     //draw line with startxy property
    //     push();
    //     stroke("cyan");
    //     strokeWeight(4);
    //     line(cLine.startxy, cLine.startxy, width - cLine.startxy, cLine.startxy);
    //     pop();
    //     //increment startxy using direction property
    //     cLine.startxy -= pow(cLine.direction, 4 * mouseX / width);
    // }


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

window.mousePressed = mousePressed;
async function mousePressed() {

    console.log("hello");

    if (mic) {

        console.log("Disposing of Mic:", mic.label);


        push();
        rectMode(CENTER);
        fill("white");
        rect(width / 2, height / 2, 100, 100);
        pop();

        // stop recording
        mic.dispose();
        // Clear mic so we can create another on next click
        mic = null;
    } else {
        // Create a new mic
        mic = new Tone.UserMedia();

        // open it asks for user permission
        await mic.open();

        console.log("Opened Microphone:", mic.label);
        // Create an analyser node 
        analyser = new AudioEnergy();

        // Connect with analyser as well so we can detect waveform
        mic.connect(analyser);
        // optionally connect to the master to hear audio input
        // mic.connect(Tone.Master);

    }
}

canvasSketch(sketch, settings);