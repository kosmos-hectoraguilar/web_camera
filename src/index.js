// Adapted from https://docs.opencv.org/3.4/dd/d00/tutorial_js_video_display.html
import cv from "opencv.js";

let video = document.getElementById("videoInput"); // video is the id of video tag
video.width = jQuery(window).width();
video.height = jQuery(window).height();
navigator.mediaDevices
  .getUserMedia({
    video: { facingMode: { exact: "environment" } },
    audio: false
  })
  .then(function(stream) {
    video.srcObject = stream;
    video.play();

    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    //let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    let cap = new cv.VideoCapture(video);

    const FPS = 30;
    function processVideo() {
      try {
        // if (!streaming) {
        //   // clean and stop.
        //   src.delete();
        //   dst.delete();
        //   return;
        // }
        let begin = Date.now();
        // start processing.
        cap.read(src);

        //cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        //cv.imshow("canvasOutput", dst);
        //let src = cv.imread('videoInput');
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        let srcVec = new cv.MatVector();
        srcVec.push_back(src);
        let accumulate = false;
        let channels = [0];
        let histSize = [256];
        let ranges = [0, 255];
        let hist = new cv.Mat();
        let mask = new cv.Mat();
        let color = new cv.Scalar(255, 255, 255);
        let scale = 2;
        // You can try more different parameters
        cv.calcHist(srcVec, channels, mask, hist, histSize, ranges, accumulate);
        let result = cv.minMaxLoc(hist, mask);
        let max = result.maxVal;
        let dst = new cv.Mat.zeros(src.rows, histSize[0] * scale, cv.CV_8UC3);
        // draw histogram
        for (let i = 0; i < histSize[0]; i++) {
          let binVal = (hist.data32F[i] * src.rows) / max;
          let point1 = new cv.Point(i * scale, src.rows - 1);
          let point2 = new cv.Point((i + 1) * scale - 1, src.rows - binVal);
          cv.rectangle(dst, point1, point2, color, cv.FILLED);
        }
        cv.imshow("canvasOutput", dst);
        src.delete();
        dst.delete();
        srcVec.delete();
        mask.delete();
        hist.delete();

        // schedule the next one.
        let delay = 1000 / FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
      } catch (err) {
        console.error(err);
      }
    }

    // schedule the first one.
    setTimeout(processVideo, 0);
  })
  .catch(function(err) {
    console.log("An error occurred! " + err);
  });
