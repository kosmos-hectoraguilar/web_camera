import cv from "opencv.js";

const FPS = 3;
const LOW_BRIGHTNESS_LIMIT = 80;
const HIGH_BRIGHTNESS_LIMIT = 200;

let video = document.getElementById("videoInput"); // video is the id of video tag
video.width = jQuery(window).width();
video.height = jQuery(window).height();
let buttonDiv = document.getElementById("buttonDiv");
let alertText = document.getElementById("alert");
var image = document.querySelector("#snap");
var snapButton = document.querySelector("#screenshot-button");

snapButton.addEventListener("click", function(e) {
  e.preventDefault();

  var snap = takeSnapshot();

  // Show image.
  image.setAttribute("src", snap);
  image.classList.add("visible");

  // Pause video playback of stream.
  video.pause();
});

buttonDiv.height = 1200;

navigator.mediaDevices
  .getUserMedia({
    video: true, //{ facingMode: { exact: "environment" } },
    audio: false
  })
  .then(function(stream) {
    video.srcObject = stream;
    video.play();

    let cap = new cv.VideoCapture(video);

    let { width, height } = stream.getTracks()[0].getSettings();
    let pointCount = 480 * 360; //video.height * video.width;
    console.log(`${width}x${height}`);

    function processVideo() {
      //let begin = Date.now();

      try {
        let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(src);

        let reducedMap = new cv.Mat(480, 360, cv.CV_8UC4);
        cv.resize(
          src, // input image
          reducedMap, // result image
          reducedMap.size(), // new dimensions
          0,
          0,
          cv.INTER_CUBIC // interpolation method
        );
        src.delete();

        let brightness = calculateBrightness(reducedMap, pointCount);
        reducedMap.delete();
        notifyBrightness(brightness);
      } catch (err) {
        console.log("An error occurred! " + err);
      } finally {
        //setTimeout(processVideo, delay);
      }
    }
    let delay = 1000 / FPS;
    setInterval(processVideo, delay);
  })
  .catch(function(err) {
    console.log("An error occurred! " + err);
  });

function takeSnapshot() {
  // Here we're using a trick that involves a hidden canvas element.
  var hidden_canvas = document.querySelector("canvas"),
    context = hidden_canvas.getContext("2d");

  var width = video.videoWidth,
    height = video.videoHeight;

  if (width && height) {
    // Setup a canvas with the same dimensions as the video.
    hidden_canvas.width = width;
    hidden_canvas.height = height;

    // Make a copy of the current frame in the video on the canvas.
    context.drawImage(video, 0, 0, width, height);

    // Turn the canvas image into a dataURL that can be used as a src for our photo.
    return hidden_canvas.toDataURL("image/png");
  }
}

/**
 * Convert the RGB matrix into a HLS one, move into all rows and cols and sum the L component of each
 * element. After it divides the brightness value and pointCount value.
 *
 * @param {Mat} src Matrix that has a definition of the frame to analyze
 * @param {Number} pointCount It is the value of width times height
 * @returns
 */
function calculateBrightness(src, pointCount) {
  let dst = new cv.Mat();
  let brightness = 0;
  cv.cvtColor(src, dst, cv.COLOR_RGB2HLS);

  for (let row = 0; row < dst.rows; row++) {
    let rowMat = dst.row(row);
    for (let col = 0; col < dst.cols; col++) {
      brightness = brightness + rowMat.col(col).data[1];
    }
  }
  dst.delete();

  brightness = brightness / pointCount;
  return brightness;
}

/**
 * Show a message in view depending on the brightness value.
 * @param {Number} brightness Brightness value from a HLS definition, it is between 0 to 254 being darker when the value
 * reach 0 and brighter when value is high.
 */
function notifyBrightness(brightness) {
  if (brightness < LOW_BRIGHTNESS_LIMIT) {
    alertText.textContent = "Muy obscuro: " + brightness;
  } else if (brightness > HIGH_BRIGHTNESS_LIMIT) {
    alertText.textContent = "Muy brillante: " + brightness;
  } else {
    alertText.textContent = "Todo normal: " + brightness;
  }
}
