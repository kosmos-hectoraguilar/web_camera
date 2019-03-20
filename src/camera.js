
import cv from "opencv.js";

let video = document.getElementById("videoInput"); // video is the id of video tag
video.width = jQuery(window).width();
video.height = jQuery(window).height();
let buttonDiv = document.getElementById("buttonDiv");
buttonDiv.height = 1200;

navigator.mediaDevices
  .getUserMedia({ video: { facingMode: { exact: "environment" } }, audio: false })
  .then(function(stream) {
    video.srcObject = stream;
    video.play();
    
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let cap = new cv.VideoCapture(video);

    const FPS = 30;
    function processVideo() {
      try {
        let begin = Date.now();

        cap.read(src);
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        let delay = 1000 / FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
      }catch(err){
        console.log("An error occurred! " + err);
      }
    }

    setTimeout(processVideo, 0);
  }).catch(function(err) {
    console.log("An error occurred! " + err);
  });