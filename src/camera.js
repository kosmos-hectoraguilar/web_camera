import cv from "opencv.js";

const FPS = 10;

let video = document.getElementById("videoInput"); // video is the id of video tag
video.width = jQuery(window).width();
video.height = jQuery(window).height();
let buttonDiv = document.getElementById("buttonDiv");
let alertText = document.getElementById("alert");

buttonDiv.height = 1200;

navigator.mediaDevices
  .getUserMedia({
    video: true, //{ facingMode: { exact: "environment" } },
    audio: false
  })
  .then(function(stream) {
    video.srcObject = stream;
    video.play();

    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let cap = new cv.VideoCapture(video);

    let { width, height } = stream.getTracks()[0].getSettings();
    let pointCount = 480 * 360; //video.height * video.width;
    console.log(`${width}x${height}`);

    function processVideo() {
      try {
        let begin = Date.now();
        //val pointMatHsv = Mat(1, 1, CvType.CV_8UC3, hsvColor)
        // Imgproc.cvtColor(pointMatHsv, pointMatRgba, Imgproc.COLOR_HSV2RGB_FULL, 4)
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
        let brightness = calculateBrightness(reducedMap, pointCount);
        reducedMap.delete();
        notifyBrightness(brightness);

        //cv.cvtColor(src, src, cv.COLOR_RGB2HLS, 0);
      } catch (err) {
        console.log("An error occurred! " + err);
      } finally {
        let delay = 300; //1000 / FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
      }
    }

    setTimeout(processVideo, 0);
  })
  .catch(function(err) {
    console.log("An error occurred! " + err);
  });

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

  //brightness = brightness / pointCount;
  brightness = brightness / pointCount; //(480 * 360);
  return brightness;
}

function notifyBrightness(brightness) {
  if (brightness < 80) {
    alertText.textContent = "Muy obscuro: " + brightness;
  } else if (brightness > 200) {
    alertText.textContent = "Muy brillante: " + brightness;
  } else {
    alertText.textContent = "Todo normal: " + brightness;
  }
}
