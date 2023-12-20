/*
 * Copyright (c) 2019 Jeppe Ledet-Pedersen
 * This software is released under the MIT license.
 * See the LICENSE file for further details.
 */

"use strict";

Spectrum.prototype.squeeze = function (value, out_min, out_max) {
  if (value <= this.min_db) return out_min;
  else if (value >= this.max_db) return out_max;
  else
    return Math.round(
      ((value - this.min_db) / (this.max_db - this.min_db)) * out_max
    );
};

Spectrum.prototype.rowToImageData = function (bins) {
  for (var i = 0; i < this.imagedata.data.length; i += 4) {
    var cindex = this.squeeze(bins[i / 4], 0, 255);
    var color = this.colormap[cindex];
    this.imagedata.data[i + 0] = color[0];
    this.imagedata.data[i + 1] = color[1];
    this.imagedata.data[i + 2] = color[2];
    this.imagedata.data[i + 3] = 255;
  }
};

Spectrum.prototype.addWaterfallRow = function (bins) {
  // Shift waterfall 1 row down
  this.ctx_wf.drawImage(
    this.ctx_wf.canvas,
    0,
    0,
    this.wf_size,
    this.wf_rows - 1,
    0,
    1,
    this.wf_size,
    this.wf_rows - 1
  );

  // Draw new line on waterfall canvas
  this.rowToImageData(bins);
  this.ctx_wf.putImageData(this.imagedata, 0, 0);

  var width = this.ctx.canvas.width;
  var height = this.ctx.canvas.height;

  // Copy scaled FFT canvas to screen. Only copy the number of rows that will
  // fit in waterfall area to avoid vertical scaling.
  this.ctx.imageSmoothingEnabled = false;
  var rows = Math.min(this.wf_rows, height - this.spectrumHeight);
  this.ctx.drawImage(
    this.ctx_wf.canvas,
    0,
    0,
    this.wf_size,
    rows,
    0,
    this.spectrumHeight,
    width,
    height - this.spectrumHeight
  );
};

Spectrum.prototype.drawFFT = function (bins) {
  this.ctx.beginPath();
  this.ctx.moveTo(-1, this.spectrumHeight + 1);
  for (var i = 0; i < bins.length; i++) {
    var y = this.spectrumHeight - this.squeeze(bins[i], 0, this.spectrumHeight);
    if (y > this.spectrumHeight - 1) y = this.spectrumHeight + 1; // Hide underflow
    if (y < 0) y = 0;
    if (i == 0) this.ctx.lineTo(-1, y);
    this.ctx.lineTo(i, y);
    if (i == bins.length - 1) this.ctx.lineTo(this.wf_size + 1, y);
  }
  this.ctx.lineTo(this.wf_size + 1, this.spectrumHeight + 1);
  this.ctx.strokeStyle = "#fefefe";
  this.ctx.stroke();
};

//Spectrum.prototype.drawSpectrum = function(bins) {
Spectrum.prototype.drawSpectrum = function () {
  var width = this.ctx.canvas.width;
  var height = this.ctx.canvas.height;

  // Modification by DJ2LS
  // Draw bandwidth lines
  // TODO: Math not correct. But a first attempt
  // it seems position is more or less equal to frequenzy by factor 10
  // eg. position 150 == 1500Hz
  /*
    // CENTER LINE
    this.ctx_wf.beginPath();
    this.ctx_wf.moveTo(150,0);
    this.ctx_wf.lineTo(150, height);
    this.ctx_wf.lineWidth = 1;
    this.ctx_wf.strokeStyle = '#8C8C8C';
    this.ctx_wf.stroke()
    */

  // 586Hz and 1700Hz LINES
  var linePositionLow = 121.6; //150 - bandwith/20
  var linePositionHigh = 178.4; //150 + bandwidth/20
  var linePositionLow2 = 65; //150 - bandwith/20
  var linePositionHigh2 = 235; //150 + bandwith/20
  this.ctx_wf.beginPath();
  this.ctx_wf.moveTo(linePositionLow, 0);
  this.ctx_wf.lineTo(linePositionLow, height);
  this.ctx_wf.moveTo(linePositionHigh, 0);
  this.ctx_wf.lineTo(linePositionHigh, height);
  this.ctx_wf.moveTo(linePositionLow2, 0);
  this.ctx_wf.lineTo(linePositionLow2, height);
  this.ctx_wf.moveTo(linePositionHigh2, 0);
  this.ctx_wf.lineTo(linePositionHigh2, height);
  this.ctx_wf.lineWidth = 1;
  this.ctx_wf.strokeStyle = "#C3C3C3";
  this.ctx_wf.stroke();

  // ---- END OF MODIFICATION ------

  // Fill with black
  this.ctx.fillStyle = "white";
  this.ctx.fillRect(0, 0, width, height);

  //Commenting out the remainder of this code, it's not needed and unused as of 6.9.11 and saves three if statements
  return;
  /*
    // FFT averaging
    if (this.averaging > 0) {
        if (!this.binsAverage || this.binsAverage.length != bins.length) {
            this.binsAverage = Array.from(bins);
        } else {
            for (var i = 0; i < bins.length; i++) {
                this.binsAverage[i] += this.alpha * (bins[i] - this.binsAverage[i]);
            }
        }
        bins = this.binsAverage;
    }

    // Max hold
    if (this.maxHold) {
        if (!this.binsMax || this.binsMax.length != bins.length) {
            this.binsMax = Array.from(bins);
        } else {
            for (var i = 0; i < bins.length; i++) {
                if (bins[i] > this.binsMax[i]) {
                    this.binsMax[i] = bins[i];
                } else {
                    // Decay
                    this.binsMax[i] = 1.0025 * this.binsMax[i];
                }
            }
        }
    }

    // Do not draw anything if spectrum is not visible
    if (this.ctx_axes.canvas.height < 1)
        return;

    // Scale for FFT
    this.ctx.save();
    this.ctx.scale(width / this.wf_size, 1);

    // Draw maxhold
    if (this.maxHold)
        this.drawFFT(this.binsMax);

    // Draw FFT bins
    this.drawFFT(bins);

    // Restore scale
    this.ctx.restore();

    // Fill scaled path
    this.ctx.fillStyle = this.gradient;
    this.ctx.fill();

    // Copy axes from offscreen canvas
    this.ctx.drawImage(this.ctx_axes.canvas, 0, 0);
    */
};

//Allow setting colormap
Spectrum.prototype.setColorMap = function (index) {
  this.colormap = colormaps[index];
};

Spectrum.prototype.updateAxes = function () {
  var width = this.ctx_axes.canvas.width;
  var height = this.ctx_axes.canvas.height;

  // Clear axes canvas
  this.ctx_axes.clearRect(0, 0, width, height);

  // Draw axes
  this.ctx_axes.font = "12px sans-serif";
  this.ctx_axes.fillStyle = "white";
  this.ctx_axes.textBaseline = "middle";

  this.ctx_axes.textAlign = "left";
  var step = 10;
  for (var i = this.min_db + 10; i <= this.max_db - 10; i += step) {
    var y = height - this.squeeze(i, 0, height);
    this.ctx_axes.fillText(i, 5, y);

    this.ctx_axes.beginPath();
    this.ctx_axes.moveTo(20, y);
    this.ctx_axes.lineTo(width, y);
    this.ctx_axes.strokeStyle = "rgba(200, 200, 200, 0.10)";
    this.ctx_axes.stroke();
  }

  this.ctx_axes.textBaseline = "bottom";
  for (var i = 0; i < 11; i++) {
    var x = Math.round(width / 10) * i;

    if (this.spanHz > 0) {
      var adjust = 0;
      if (i == 0) {
        this.ctx_axes.textAlign = "left";
        adjust = 3;
      } else if (i == 10) {
        this.ctx_axes.textAlign = "right";
        adjust = -3;
      } else {
        this.ctx_axes.textAlign = "center";
      }

      var freq = this.centerHz + (this.spanHz / 10) * (i - 5);
      if (this.centerHz + this.spanHz > 1e6) freq = freq / 1e6 + "M";
      else if (this.centerHz + this.spanHz > 1e3) freq = freq / 1e3 + "k";
      this.ctx_axes.fillText(freq, x + adjust, height - 3);
    }

    this.ctx_axes.beginPath();
    this.ctx_axes.moveTo(x, 0);
    this.ctx_axes.lineTo(x, height);
    this.ctx_axes.strokeStyle = "rgba(200, 200, 200, 0.10)";
    this.ctx_axes.stroke();
  }
};

Spectrum.prototype.addData = function (data) {
  if (!this.paused) {
    if (data.length != this.wf_size) {
      this.wf_size = data.length;
      this.ctx_wf.canvas.width = data.length;
      this.ctx_wf.fillStyle = "white";
      this.ctx_wf.fillRect(0, 0, this.wf.width, this.wf.height);
      this.imagedata = this.ctx_wf.createImageData(data.length, 1);
    }
    //this.drawSpectrum(data);
    this.drawSpectrum();
    this.addWaterfallRow(data);
    this.resize();
  }
};

Spectrum.prototype.updateSpectrumRatio = function () {
  this.spectrumHeight = Math.round(
    (this.canvas.height * this.spectrumPercent) / 100.0
  );

  this.gradient = this.ctx.createLinearGradient(0, 0, 0, this.spectrumHeight);
  for (var i = 0; i < this.colormap.length; i++) {
    var c = this.colormap[this.colormap.length - 1 - i];
    this.gradient.addColorStop(
      i / this.colormap.length,
      "rgba(" + c[0] + "," + c[1] + "," + c[2] + ", 1.0)"
    );
  }
};

Spectrum.prototype.resize = function () {
  var width = this.parent.clientWidth;
  var height =this.parent.clientHeight;
  // little helper for setting height of clientHeight is not working as expected
  if (height == 0){
    var height = 250

  }
  if (width == 0){
    width=500;
  }

  if (this.canvas.width != width || this.canvas.height != height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.updateSpectrumRatio();
  }

  if (this.axes.width != width || this.axes.height != this.spectrumHeight) {
    this.axes.width = width;
    this.axes.height = this.spectrumHeight;
    this.updateAxes();
  }
};

Spectrum.prototype.setSpectrumPercent = function (percent) {
  if (percent >= 0 && percent <= 100) {
    this.spectrumPercent = percent;
    this.updateSpectrumRatio();
  }
};

Spectrum.prototype.incrementSpectrumPercent = function () {
  if (this.spectrumPercent + this.spectrumPercentStep <= 100) {
    this.setSpectrumPercent(this.spectrumPercent + this.spectrumPercentStep);
  }
};

Spectrum.prototype.decrementSpectrumPercent = function () {
  if (this.spectrumPercent - this.spectrumPercentStep >= 0) {
    this.setSpectrumPercent(this.spectrumPercent - this.spectrumPercentStep);
  }
};

Spectrum.prototype.toggleColor = function () {
  this.colorindex++;
  if (this.colorindex >= colormaps.length) this.colorindex = 0;
  this.colormap = colormaps[this.colorindex];
  this.updateSpectrumRatio();
};

Spectrum.prototype.setRange = function (min_db, max_db) {
  this.min_db = min_db;
  this.max_db = max_db;
  this.updateAxes();
};

Spectrum.prototype.rangeUp = function () {
  this.setRange(this.min_db - 5, this.max_db - 5);
};

Spectrum.prototype.rangeDown = function () {
  this.setRange(this.min_db + 5, this.max_db + 5);
};

Spectrum.prototype.rangeIncrease = function () {
  this.setRange(this.min_db - 5, this.max_db + 5);
};

Spectrum.prototype.rangeDecrease = function () {
  if (this.max_db - this.min_db > 10)
    this.setRange(this.min_db + 5, this.max_db - 5);
};

Spectrum.prototype.setCenterHz = function (hz) {
  this.centerHz = hz;
  this.updateAxes();
};

Spectrum.prototype.setSpanHz = function (hz) {
  this.spanHz = hz;
  this.updateAxes();
};

Spectrum.prototype.setAveraging = function (num) {
  if (num >= 0) {
    this.averaging = num;
    this.alpha = 2 / (this.averaging + 1);
  }
};

Spectrum.prototype.incrementAveraging = function () {
  this.setAveraging(this.averaging + 1);
};

Spectrum.prototype.decrementAveraging = function () {
  if (this.averaging > 0) {
    this.setAveraging(this.averaging - 1);
  }
};

Spectrum.prototype.setPaused = function (paused) {
  this.paused = paused;
};

Spectrum.prototype.togglePaused = function () {
  this.setPaused(!this.paused);
};

Spectrum.prototype.setMaxHold = function (maxhold) {
  this.maxHold = maxhold;
  this.binsMax = undefined;
};

Spectrum.prototype.toggleMaxHold = function () {
  this.setMaxHold(!this.maxHold);
};

Spectrum.prototype.toggleFullscreen = function () {
  if (!this.fullscreen) {
    if (this.canvas.requestFullscreen) {
      this.canvas.requestFullscreen();
    } else if (this.canvas.mozRequestFullScreen) {
      this.canvas.mozRequestFullScreen();
    } else if (this.canvas.webkitRequestFullscreen) {
      this.canvas.webkitRequestFullscreen();
    } else if (this.canvas.msRequestFullscreen) {
      this.canvas.msRequestFullscreen();
    }
    this.fullscreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    this.fullscreen = false;
  }
};

Spectrum.prototype.onKeypress = function (e) {
  if (e.key == " ") {
    this.togglePaused();
  } else if (e.key == "f") {
    this.toggleFullscreen();
  } else if (e.key == "c") {
    this.toggleColor();
  } else if (e.key == "ArrowUp") {
    this.rangeUp();
  } else if (e.key == "ArrowDown") {
    this.rangeDown();
  } else if (e.key == "ArrowLeft") {
    this.rangeDecrease();
  } else if (e.key == "ArrowRight") {
    this.rangeIncrease();
  } else if (e.key == "s") {
    this.incrementSpectrumPercent();
  } else if (e.key == "w") {
    this.decrementSpectrumPercent();
  } else if (e.key == "+") {
    this.incrementAveraging();
  } else if (e.key == "-") {
    this.decrementAveraging();
  } else if (e.key == "m") {
    this.toggleMaxHold();
  }
};

export function Spectrum(id, options) {

  //  console.log("waterfall init....")
  //console.log(document.getElementById(id))

  // Handle options
  this.centerHz = options && options.centerHz ? options.centerHz : 1500;
  this.spanHz = options && options.spanHz ? options.spanHz : 0;
  this.wf_size = options && options.wf_size ? options.wf_size : 0;
  this.wf_rows = options && options.wf_rows ? options.wf_rows : 1024;
  this.spectrumPercent =
    options && options.spectrumPercent ? options.spectrumPercent : 0;
  this.spectrumPercentStep =
    options && options.spectrumPercentStep ? options.spectrumPercentStep : 0;
  this.averaging = options && options.averaging ? options.averaging : 0;
  this.maxHold = options && options.maxHold ? options.maxHold : false;

  // Setup state
  this.paused = false;
  this.fullscreen = false;
  this.min_db = 0;
  this.max_db = 70;
  this.spectrumHeight = 0;

  // Colors
  this.colorindex = 0;
  this.colormap = colormaps[1];

  // Create main canvas and adjust dimensions to match actual
  this.canvas = document.getElementById(id);
  this.parent = this.canvas.parentElement;
  this.canvas.height = this.canvas.clientHeight;
  this.canvas.width = this.canvas.clientWidth;

  this.ctx = this.canvas.getContext("2d");
  this.ctx.fillStyle = "white";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  // Create offscreen canvas for axes
  this.axes = document.createElement("canvas");
  this.axes.height = 1; // Updated later
  this.axes.width = this.canvas.width;
  this.ctx_axes = this.axes.getContext("2d");

  // Create offscreen canvas for waterfall
  this.wf = document.createElement("canvas");
  this.wf.height = this.wf_rows;
  this.wf.width = this.wf_size;
  this.ctx_wf = this.wf.getContext("2d");

  // Trigger first render
  this.setAveraging(this.averaging);
  this.updateSpectrumRatio();
  this.resize();
}



var turbo = [
  [48, 18, 59],
  [50, 21, 67],
  [51, 24, 74],
  [52, 27, 81],
  [53, 30, 88],
  [54, 33, 95],
  [55, 36, 102],
  [56, 39, 109],
  [57, 42, 115],
  [58, 45, 121],
  [59, 47, 128],
  [60, 50, 134],
  [61, 53, 139],
  [62, 56, 145],
  [63, 59, 151],
  [63, 62, 156],
  [64, 64, 162],
  [65, 67, 167],
  [65, 70, 172],
  [66, 73, 177],
  [66, 75, 181],
  [67, 78, 186],
  [68, 81, 191],
  [68, 84, 195],
  [68, 86, 199],
  [69, 89, 203],
  [69, 92, 207],
  [69, 94, 211],
  [70, 97, 214],
  [70, 100, 218],
  [70, 102, 221],
  [70, 105, 224],
  [70, 107, 227],
  [71, 110, 230],
  [71, 113, 233],
  [71, 115, 235],
  [71, 118, 238],
  [71, 120, 240],
  [71, 123, 242],
  [70, 125, 244],
  [70, 128, 246],
  [70, 130, 248],
  [70, 133, 250],
  [70, 135, 251],
  [69, 138, 252],
  [69, 140, 253],
  [68, 143, 254],
  [67, 145, 254],
  [66, 148, 255],
  [65, 150, 255],
  [64, 153, 255],
  [62, 155, 254],
  [61, 158, 254],
  [59, 160, 253],
  [58, 163, 252],
  [56, 165, 251],
  [55, 168, 250],
  [53, 171, 248],
  [51, 173, 247],
  [49, 175, 245],
  [47, 178, 244],
  [46, 180, 242],
  [44, 183, 240],
  [42, 185, 238],
  [40, 188, 235],
  [39, 190, 233],
  [37, 192, 231],
  [35, 195, 228],
  [34, 197, 226],
  [32, 199, 223],
  [31, 201, 221],
  [30, 203, 218],
  [28, 205, 216],
  [27, 208, 213],
  [26, 210, 210],
  [26, 212, 208],
  [25, 213, 205],
  [24, 215, 202],
  [24, 217, 200],
  [24, 219, 197],
  [24, 221, 194],
  [24, 222, 192],
  [24, 224, 189],
  [25, 226, 187],
  [25, 227, 185],
  [26, 228, 182],
  [28, 230, 180],
  [29, 231, 178],
  [31, 233, 175],
  [32, 234, 172],
  [34, 235, 170],
  [37, 236, 167],
  [39, 238, 164],
  [42, 239, 161],
  [44, 240, 158],
  [47, 241, 155],
  [50, 242, 152],
  [53, 243, 148],
  [56, 244, 145],
  [60, 245, 142],
  [63, 246, 138],
  [67, 247, 135],
  [70, 248, 132],
  [74, 248, 128],
  [78, 249, 125],
  [82, 250, 122],
  [85, 250, 118],
  [89, 251, 115],
  [93, 252, 111],
  [97, 252, 108],
  [101, 253, 105],
  [105, 253, 102],
  [109, 254, 98],
  [113, 254, 95],
  [117, 254, 92],
  [121, 254, 89],
  [125, 255, 86],
  [128, 255, 83],
  [132, 255, 81],
  [136, 255, 78],
  [139, 255, 75],
  [143, 255, 73],
  [146, 255, 71],
  [150, 254, 68],
  [153, 254, 66],
  [156, 254, 64],
  [159, 253, 63],
  [161, 253, 61],
  [164, 252, 60],
  [167, 252, 58],
  [169, 251, 57],
  [172, 251, 56],
  [175, 250, 55],
  [177, 249, 54],
  [180, 248, 54],
  [183, 247, 53],
  [185, 246, 53],
  [188, 245, 52],
  [190, 244, 52],
  [193, 243, 52],
  [195, 241, 52],
  [198, 240, 52],
  [200, 239, 52],
  [203, 237, 52],
  [205, 236, 52],
  [208, 234, 52],
  [210, 233, 53],
  [212, 231, 53],
  [215, 229, 53],
  [217, 228, 54],
  [219, 226, 54],
  [221, 224, 55],
  [223, 223, 55],
  [225, 221, 55],
  [227, 219, 56],
  [229, 217, 56],
  [231, 215, 57],
  [233, 213, 57],
  [235, 211, 57],
  [236, 209, 58],
  [238, 207, 58],
  [239, 205, 58],
  [241, 203, 58],
  [242, 201, 58],
  [244, 199, 58],
  [245, 197, 58],
  [246, 195, 58],
  [247, 193, 58],
  [248, 190, 57],
  [249, 188, 57],
  [250, 186, 57],
  [251, 184, 56],
  [251, 182, 55],
  [252, 179, 54],
  [252, 177, 54],
  [253, 174, 53],
  [253, 172, 52],
  [254, 169, 51],
  [254, 167, 50],
  [254, 164, 49],
  [254, 161, 48],
  [254, 158, 47],
  [254, 155, 45],
  [254, 153, 44],
  [254, 150, 43],
  [254, 147, 42],
  [254, 144, 41],
  [253, 141, 39],
  [253, 138, 38],
  [252, 135, 37],
  [252, 132, 35],
  [251, 129, 34],
  [251, 126, 33],
  [250, 123, 31],
  [249, 120, 30],
  [249, 117, 29],
  [248, 114, 28],
  [247, 111, 26],
  [246, 108, 25],
  [245, 105, 24],
  [244, 102, 23],
  [243, 99, 21],
  [242, 96, 20],
  [241, 93, 19],
  [240, 91, 18],
  [239, 88, 17],
  [237, 85, 16],
  [236, 83, 15],
  [235, 80, 14],
  [234, 78, 13],
  [232, 75, 12],
  [231, 73, 12],
  [229, 71, 11],
  [228, 69, 10],
  [226, 67, 10],
  [225, 65, 9],
  [223, 63, 8],
  [221, 61, 8],
  [220, 59, 7],
  [218, 57, 7],
  [216, 55, 6],
  [214, 53, 6],
  [212, 51, 5],
  [210, 49, 5],
  [208, 47, 5],
  [206, 45, 4],
  [204, 43, 4],
  [202, 42, 4],
  [200, 40, 3],
  [197, 38, 3],
  [195, 37, 3],
  [193, 35, 2],
  [190, 33, 2],
  [188, 32, 2],
  [185, 30, 2],
  [183, 29, 2],
  [180, 27, 1],
  [178, 26, 1],
  [175, 24, 1],
  [172, 23, 1],
  [169, 22, 1],
  [167, 20, 1],
  [164, 19, 1],
  [161, 18, 1],
  [158, 16, 1],
  [155, 15, 1],
  [152, 14, 1],
  [149, 13, 1],
  [146, 11, 1],
  [142, 10, 1],
  [139, 9, 2],
  [136, 8, 2],
  [133, 7, 2],
  [129, 6, 2],
  [126, 5, 2],
  [122, 4, 3],
];
var fosphor = [
  [6, 0, 13],
  [7, 0, 14],
  [7, 0, 15],
  [7, 0, 16],
  [7, 0, 17],
  [7, 0, 18],
  [7, 0, 18],
  [7, 0, 19],
  [7, 0, 20],
  [7, 0, 21],
  [7, 0, 22],
  [7, 0, 23],
  [7, 0, 24],
  [7, 0, 25],
  [7, 0, 26],
  [6, 0, 27],
  [6, 0, 28],
  [6, 0, 29],
  [5, 0, 30],
  [5, 0, 31],
  [5, 0, 32],
  [4, 0, 33],
  [4, 0, 34],
  [3, 0, 35],
  [3, 0, 36],
  [2, 0, 36],
  [2, 0, 37],
  [1, 0, 38],
  [0, 0, 39],
  [0, 0, 40],
  [0, 1, 41],
  [0, 2, 42],
  [0, 3, 43],
  [0, 4, 44],
  [0, 5, 45],
  [0, 5, 46],
  [0, 6, 47],
  [0, 7, 48],
  [0, 8, 49],
  [0, 9, 50],
  [0, 10, 51],
  [0, 12, 52],
  [0, 13, 53],
  [0, 14, 54],
  [0, 15, 55],
  [0, 16, 56],
  [0, 18, 56],
  [0, 19, 57],
  [0, 20, 58],
  [0, 22, 59],
  [0, 23, 60],
  [0, 24, 61],
  [0, 26, 62],
  [0, 27, 63],
  [0, 29, 64],
  [0, 31, 65],
  [0, 32, 66],
  [0, 34, 67],
  [0, 36, 68],
  [0, 37, 69],
  [0, 39, 70],
  [0, 41, 71],
  [0, 43, 72],
  [0, 44, 73],
  [0, 46, 74],
  [0, 48, 74],
  [0, 50, 75],
  [0, 52, 76],
  [0, 54, 77],
  [0, 56, 78],
  [0, 58, 79],
  [0, 60, 80],
  [0, 63, 81],
  [0, 65, 82],
  [0, 67, 83],
  [0, 69, 84],
  [0, 71, 85],
  [0, 74, 86],
  [0, 76, 87],
  [0, 79, 88],
  [0, 81, 89],
  [0, 83, 90],
  [0, 86, 91],
  [0, 88, 92],
  [0, 91, 93],
  [0, 94, 94],
  [0, 94, 93],
  [0, 95, 92],
  [0, 96, 91],
  [0, 97, 90],
  [0, 98, 90],
  [0, 99, 89],
  [0, 100, 88],
  [0, 101, 87],
  [0, 102, 86],
  [0, 103, 85],
  [0, 104, 84],
  [0, 105, 83],
  [0, 106, 82],
  [0, 107, 80],
  [0, 108, 79],
  [0, 109, 78],
  [0, 110, 77],
  [0, 111, 75],
  [0, 112, 74],
  [0, 112, 73],
  [0, 113, 71],
  [0, 114, 70],
  [0, 115, 69],
  [0, 116, 67],
  [0, 117, 66],
  [0, 118, 64],
  [0, 119, 62],
  [0, 120, 61],
  [0, 121, 59],
  [0, 122, 57],
  [0, 123, 56],
  [0, 124, 54],
  [0, 125, 52],
  [0, 126, 50],
  [0, 127, 48],
  [0, 128, 47],
  [0, 129, 45],
  [0, 130, 43],
  [0, 131, 41],
  [0, 132, 39],
  [0, 132, 37],
  [0, 133, 35],
  [0, 134, 32],
  [0, 135, 30],
  [0, 136, 28],
  [0, 137, 26],
  [0, 138, 24],
  [0, 139, 21],
  [0, 140, 19],
  [0, 141, 17],
  [0, 142, 14],
  [0, 143, 12],
  [0, 144, 9],
  [0, 145, 7],
  [0, 146, 4],
  [0, 147, 2],
  [1, 148, 0],
  [3, 149, 0],
  [6, 150, 0],
  [9, 150, 0],
  [12, 151, 0],
  [14, 152, 0],
  [17, 153, 0],
  [20, 154, 0],
  [23, 155, 0],
  [26, 156, 0],
  [29, 157, 0],
  [32, 158, 0],
  [35, 159, 0],
  [38, 160, 0],
  [41, 161, 0],
  [44, 162, 0],
  [47, 163, 0],
  [50, 164, 0],
  [53, 165, 0],
  [57, 166, 0],
  [60, 167, 0],
  [63, 168, 0],
  [66, 169, 0],
  [70, 170, 0],
  [73, 170, 0],
  [77, 171, 0],
  [80, 172, 0],
  [84, 173, 0],
  [87, 174, 0],
  [91, 175, 0],
  [94, 176, 0],
  [98, 177, 0],
  [102, 178, 0],
  [105, 179, 0],
  [109, 180, 0],
  [113, 181, 0],
  [117, 182, 0],
  [120, 183, 0],
  [124, 184, 0],
  [128, 185, 0],
  [132, 186, 0],
  [136, 187, 0],
  [140, 188, 0],
  [144, 188, 0],
  [148, 189, 0],
  [152, 190, 0],
  [156, 191, 0],
  [161, 192, 0],
  [165, 193, 0],
  [169, 194, 0],
  [173, 195, 0],
  [178, 196, 0],
  [182, 197, 0],
  [186, 198, 0],
  [191, 199, 0],
  [195, 200, 0],
  [200, 201, 0],
  [202, 199, 0],
  [203, 197, 0],
  [204, 194, 0],
  [205, 191, 0],
  [206, 189, 0],
  [207, 186, 0],
  [208, 183, 0],
  [208, 180, 0],
  [209, 177, 0],
  [210, 174, 0],
  [211, 172, 0],
  [212, 169, 0],
  [213, 166, 0],
  [214, 163, 0],
  [215, 159, 0],
  [216, 156, 0],
  [217, 153, 0],
  [218, 150, 0],
  [219, 147, 0],
  [220, 144, 0],
  [221, 140, 0],
  [222, 137, 0],
  [223, 134, 0],
  [224, 130, 0],
  [225, 127, 0],
  [226, 123, 0],
  [226, 120, 0],
  [227, 116, 0],
  [228, 113, 0],
  [229, 109, 0],
  [230, 106, 0],
  [231, 102, 0],
  [232, 98, 0],
  [233, 95, 0],
  [234, 91, 0],
  [235, 87, 0],
  [236, 83, 0],
  [237, 79, 0],
  [238, 76, 0],
  [239, 72, 0],
  [240, 68, 0],
  [241, 64, 0],
  [242, 60, 0],
  [243, 56, 0],
  [244, 52, 0],
  [245, 47, 0],
  [246, 43, 0],
  [246, 39, 0],
  [247, 35, 0],
  [248, 31, 0],
  [249, 26, 0],
  [250, 22, 0],
  [251, 18, 0],
  [252, 13, 0],
  [253, 9, 0],
  [254, 4, 0],
  [255, 0, 0],
];
var viridis = [
  [68, 1, 84],
  [68, 2, 86],
  [69, 4, 87],
  [69, 5, 89],
  [70, 7, 90],
  [70, 8, 92],
  [70, 10, 93],
  [70, 11, 94],
  [71, 13, 96],
  [71, 14, 97],
  [71, 16, 99],
  [71, 17, 100],
  [71, 19, 101],
  [72, 20, 103],
  [72, 22, 104],
  [72, 23, 105],
  [72, 24, 106],
  [72, 26, 108],
  [72, 27, 109],
  [72, 28, 110],
  [72, 29, 111],
  [72, 31, 112],
  [72, 32, 113],
  [72, 33, 115],
  [72, 35, 116],
  [72, 36, 117],
  [72, 37, 118],
  [72, 38, 119],
  [72, 40, 120],
  [72, 41, 121],
  [71, 42, 122],
  [71, 44, 122],
  [71, 45, 123],
  [71, 46, 124],
  [71, 47, 125],
  [70, 48, 126],
  [70, 50, 126],
  [70, 51, 127],
  [70, 52, 128],
  [69, 53, 129],
  [69, 55, 129],
  [69, 56, 130],
  [68, 57, 131],
  [68, 58, 131],
  [68, 59, 132],
  [67, 61, 132],
  [67, 62, 133],
  [66, 63, 133],
  [66, 64, 134],
  [66, 65, 134],
  [65, 66, 135],
  [65, 68, 135],
  [64, 69, 136],
  [64, 70, 136],
  [63, 71, 136],
  [63, 72, 137],
  [62, 73, 137],
  [62, 74, 137],
  [62, 76, 138],
  [61, 77, 138],
  [61, 78, 138],
  [60, 79, 138],
  [60, 80, 139],
  [59, 81, 139],
  [59, 82, 139],
  [58, 83, 139],
  [58, 84, 140],
  [57, 85, 140],
  [57, 86, 140],
  [56, 88, 140],
  [56, 89, 140],
  [55, 90, 140],
  [55, 91, 141],
  [54, 92, 141],
  [54, 93, 141],
  [53, 94, 141],
  [53, 95, 141],
  [52, 96, 141],
  [52, 97, 141],
  [51, 98, 141],
  [51, 99, 141],
  [50, 100, 142],
  [50, 101, 142],
  [49, 102, 142],
  [49, 103, 142],
  [49, 104, 142],
  [48, 105, 142],
  [48, 106, 142],
  [47, 107, 142],
  [47, 108, 142],
  [46, 109, 142],
  [46, 110, 142],
  [46, 111, 142],
  [45, 112, 142],
  [45, 113, 142],
  [44, 113, 142],
  [44, 114, 142],
  [44, 115, 142],
  [43, 116, 142],
  [43, 117, 142],
  [42, 118, 142],
  [42, 119, 142],
  [42, 120, 142],
  [41, 121, 142],
  [41, 122, 142],
  [41, 123, 142],
  [40, 124, 142],
  [40, 125, 142],
  [39, 126, 142],
  [39, 127, 142],
  [39, 128, 142],
  [38, 129, 142],
  [38, 130, 142],
  [38, 130, 142],
  [37, 131, 142],
  [37, 132, 142],
  [37, 133, 142],
  [36, 134, 142],
  [36, 135, 142],
  [35, 136, 142],
  [35, 137, 142],
  [35, 138, 141],
  [34, 139, 141],
  [34, 140, 141],
  [34, 141, 141],
  [33, 142, 141],
  [33, 143, 141],
  [33, 144, 141],
  [33, 145, 140],
  [32, 146, 140],
  [32, 146, 140],
  [32, 147, 140],
  [31, 148, 140],
  [31, 149, 139],
  [31, 150, 139],
  [31, 151, 139],
  [31, 152, 139],
  [31, 153, 138],
  [31, 154, 138],
  [30, 155, 138],
  [30, 156, 137],
  [30, 157, 137],
  [31, 158, 137],
  [31, 159, 136],
  [31, 160, 136],
  [31, 161, 136],
  [31, 161, 135],
  [31, 162, 135],
  [32, 163, 134],
  [32, 164, 134],
  [33, 165, 133],
  [33, 166, 133],
  [34, 167, 133],
  [34, 168, 132],
  [35, 169, 131],
  [36, 170, 131],
  [37, 171, 130],
  [37, 172, 130],
  [38, 173, 129],
  [39, 173, 129],
  [40, 174, 128],
  [41, 175, 127],
  [42, 176, 127],
  [44, 177, 126],
  [45, 178, 125],
  [46, 179, 124],
  [47, 180, 124],
  [49, 181, 123],
  [50, 182, 122],
  [52, 182, 121],
  [53, 183, 121],
  [55, 184, 120],
  [56, 185, 119],
  [58, 186, 118],
  [59, 187, 117],
  [61, 188, 116],
  [63, 188, 115],
  [64, 189, 114],
  [66, 190, 113],
  [68, 191, 112],
  [70, 192, 111],
  [72, 193, 110],
  [74, 193, 109],
  [76, 194, 108],
  [78, 195, 107],
  [80, 196, 106],
  [82, 197, 105],
  [84, 197, 104],
  [86, 198, 103],
  [88, 199, 101],
  [90, 200, 100],
  [92, 200, 99],
  [94, 201, 98],
  [96, 202, 96],
  [99, 203, 95],
  [101, 203, 94],
  [103, 204, 92],
  [105, 205, 91],
  [108, 205, 90],
  [110, 206, 88],
  [112, 207, 87],
  [115, 208, 86],
  [117, 208, 84],
  [119, 209, 83],
  [122, 209, 81],
  [124, 210, 80],
  [127, 211, 78],
  [129, 211, 77],
  [132, 212, 75],
  [134, 213, 73],
  [137, 213, 72],
  [139, 214, 70],
  [142, 214, 69],
  [144, 215, 67],
  [147, 215, 65],
  [149, 216, 64],
  [152, 216, 62],
  [155, 217, 60],
  [157, 217, 59],
  [160, 218, 57],
  [162, 218, 55],
  [165, 219, 54],
  [168, 219, 52],
  [170, 220, 50],
  [173, 220, 48],
  [176, 221, 47],
  [178, 221, 45],
  [181, 222, 43],
  [184, 222, 41],
  [186, 222, 40],
  [189, 223, 38],
  [192, 223, 37],
  [194, 223, 35],
  [197, 224, 33],
  [200, 224, 32],
  [202, 225, 31],
  [205, 225, 29],
  [208, 225, 28],
  [210, 226, 27],
  [213, 226, 26],
  [216, 226, 25],
  [218, 227, 25],
  [221, 227, 24],
  [223, 227, 24],
  [226, 228, 24],
  [229, 228, 25],
  [231, 228, 25],
  [234, 229, 26],
  [236, 229, 27],
  [239, 229, 28],
  [241, 229, 29],
  [244, 230, 30],
  [246, 230, 32],
  [248, 230, 33],
  [251, 231, 35],
  [253, 231, 37],
];
var inferno = [
  [0, 0, 4],
  [1, 0, 5],
  [1, 1, 6],
  [1, 1, 8],
  [2, 1, 10],
  [2, 2, 12],
  [2, 2, 14],
  [3, 2, 16],
  [4, 3, 18],
  [4, 3, 20],
  [5, 4, 23],
  [6, 4, 25],
  [7, 5, 27],
  [8, 5, 29],
  [9, 6, 31],
  [10, 7, 34],
  [11, 7, 36],
  [12, 8, 38],
  [13, 8, 41],
  [14, 9, 43],
  [16, 9, 45],
  [17, 10, 48],
  [18, 10, 50],
  [20, 11, 52],
  [21, 11, 55],
  [22, 11, 57],
  [24, 12, 60],
  [25, 12, 62],
  [27, 12, 65],
  [28, 12, 67],
  [30, 12, 69],
  [31, 12, 72],
  [33, 12, 74],
  [35, 12, 76],
  [36, 12, 79],
  [38, 12, 81],
  [40, 11, 83],
  [41, 11, 85],
  [43, 11, 87],
  [45, 11, 89],
  [47, 10, 91],
  [49, 10, 92],
  [50, 10, 94],
  [52, 10, 95],
  [54, 9, 97],
  [56, 9, 98],
  [57, 9, 99],
  [59, 9, 100],
  [61, 9, 101],
  [62, 9, 102],
  [64, 10, 103],
  [66, 10, 104],
  [68, 10, 104],
  [69, 10, 105],
  [71, 11, 106],
  [73, 11, 106],
  [74, 12, 107],
  [76, 12, 107],
  [77, 13, 108],
  [79, 13, 108],
  [81, 14, 108],
  [82, 14, 109],
  [84, 15, 109],
  [85, 15, 109],
  [87, 16, 110],
  [89, 16, 110],
  [90, 17, 110],
  [92, 18, 110],
  [93, 18, 110],
  [95, 19, 110],
  [97, 19, 110],
  [98, 20, 110],
  [100, 21, 110],
  [101, 21, 110],
  [103, 22, 110],
  [105, 22, 110],
  [106, 23, 110],
  [108, 24, 110],
  [109, 24, 110],
  [111, 25, 110],
  [113, 25, 110],
  [114, 26, 110],
  [116, 26, 110],
  [117, 27, 110],
  [119, 28, 109],
  [120, 28, 109],
  [122, 29, 109],
  [124, 29, 109],
  [125, 30, 109],
  [127, 30, 108],
  [128, 31, 108],
  [130, 32, 108],
  [132, 32, 107],
  [133, 33, 107],
  [135, 33, 107],
  [136, 34, 106],
  [138, 34, 106],
  [140, 35, 105],
  [141, 35, 105],
  [143, 36, 105],
  [144, 37, 104],
  [146, 37, 104],
  [147, 38, 103],
  [149, 38, 103],
  [151, 39, 102],
  [152, 39, 102],
  [154, 40, 101],
  [155, 41, 100],
  [157, 41, 100],
  [159, 42, 99],
  [160, 42, 99],
  [162, 43, 98],
  [163, 44, 97],
  [165, 44, 96],
  [166, 45, 96],
  [168, 46, 95],
  [169, 46, 94],
  [171, 47, 94],
  [173, 48, 93],
  [174, 48, 92],
  [176, 49, 91],
  [177, 50, 90],
  [179, 50, 90],
  [180, 51, 89],
  [182, 52, 88],
  [183, 53, 87],
  [185, 53, 86],
  [186, 54, 85],
  [188, 55, 84],
  [189, 56, 83],
  [191, 57, 82],
  [192, 58, 81],
  [193, 58, 80],
  [195, 59, 79],
  [196, 60, 78],
  [198, 61, 77],
  [199, 62, 76],
  [200, 63, 75],
  [202, 64, 74],
  [203, 65, 73],
  [204, 66, 72],
  [206, 67, 71],
  [207, 68, 70],
  [208, 69, 69],
  [210, 70, 68],
  [211, 71, 67],
  [212, 72, 66],
  [213, 74, 65],
  [215, 75, 63],
  [216, 76, 62],
  [217, 77, 61],
  [218, 78, 60],
  [219, 80, 59],
  [221, 81, 58],
  [222, 82, 56],
  [223, 83, 55],
  [224, 85, 54],
  [225, 86, 53],
  [226, 87, 52],
  [227, 89, 51],
  [228, 90, 49],
  [229, 92, 48],
  [230, 93, 47],
  [231, 94, 46],
  [232, 96, 45],
  [233, 97, 43],
  [234, 99, 42],
  [235, 100, 41],
  [235, 102, 40],
  [236, 103, 38],
  [237, 105, 37],
  [238, 106, 36],
  [239, 108, 35],
  [239, 110, 33],
  [240, 111, 32],
  [241, 113, 31],
  [241, 115, 29],
  [242, 116, 28],
  [243, 118, 27],
  [243, 120, 25],
  [244, 121, 24],
  [245, 123, 23],
  [245, 125, 21],
  [246, 126, 20],
  [246, 128, 19],
  [247, 130, 18],
  [247, 132, 16],
  [248, 133, 15],
  [248, 135, 14],
  [248, 137, 12],
  [249, 139, 11],
  [249, 140, 10],
  [249, 142, 9],
  [250, 144, 8],
  [250, 146, 7],
  [250, 148, 7],
  [251, 150, 6],
  [251, 151, 6],
  [251, 153, 6],
  [251, 155, 6],
  [251, 157, 7],
  [252, 159, 7],
  [252, 161, 8],
  [252, 163, 9],
  [252, 165, 10],
  [252, 166, 12],
  [252, 168, 13],
  [252, 170, 15],
  [252, 172, 17],
  [252, 174, 18],
  [252, 176, 20],
  [252, 178, 22],
  [252, 180, 24],
  [251, 182, 26],
  [251, 184, 29],
  [251, 186, 31],
  [251, 188, 33],
  [251, 190, 35],
  [250, 192, 38],
  [250, 194, 40],
  [250, 196, 42],
  [250, 198, 45],
  [249, 199, 47],
  [249, 201, 50],
  [249, 203, 53],
  [248, 205, 55],
  [248, 207, 58],
  [247, 209, 61],
  [247, 211, 64],
  [246, 213, 67],
  [246, 215, 70],
  [245, 217, 73],
  [245, 219, 76],
  [244, 221, 79],
  [244, 223, 83],
  [244, 225, 86],
  [243, 227, 90],
  [243, 229, 93],
  [242, 230, 97],
  [242, 232, 101],
  [242, 234, 105],
  [241, 236, 109],
  [241, 237, 113],
  [241, 239, 117],
  [241, 241, 121],
  [242, 242, 125],
  [242, 244, 130],
  [243, 245, 134],
  [243, 246, 138],
  [244, 248, 142],
  [245, 249, 146],
  [246, 250, 150],
  [248, 251, 154],
  [249, 252, 157],
  [250, 253, 161],
  [252, 255, 164],
];
var magma = [
  [0, 0, 4],
  [1, 0, 5],
  [1, 1, 6],
  [1, 1, 8],
  [2, 1, 9],
  [2, 2, 11],
  [2, 2, 13],
  [3, 3, 15],
  [3, 3, 18],
  [4, 4, 20],
  [5, 4, 22],
  [6, 5, 24],
  [6, 5, 26],
  [7, 6, 28],
  [8, 7, 30],
  [9, 7, 32],
  [10, 8, 34],
  [11, 9, 36],
  [12, 9, 38],
  [13, 10, 41],
  [14, 11, 43],
  [16, 11, 45],
  [17, 12, 47],
  [18, 13, 49],
  [19, 13, 52],
  [20, 14, 54],
  [21, 14, 56],
  [22, 15, 59],
  [24, 15, 61],
  [25, 16, 63],
  [26, 16, 66],
  [28, 16, 68],
  [29, 17, 71],
  [30, 17, 73],
  [32, 17, 75],
  [33, 17, 78],
  [34, 17, 80],
  [36, 18, 83],
  [37, 18, 85],
  [39, 18, 88],
  [41, 17, 90],
  [42, 17, 92],
  [44, 17, 95],
  [45, 17, 97],
  [47, 17, 99],
  [49, 17, 101],
  [51, 16, 103],
  [52, 16, 105],
  [54, 16, 107],
  [56, 16, 108],
  [57, 15, 110],
  [59, 15, 112],
  [61, 15, 113],
  [63, 15, 114],
  [64, 15, 116],
  [66, 15, 117],
  [68, 15, 118],
  [69, 16, 119],
  [71, 16, 120],
  [73, 16, 120],
  [74, 16, 121],
  [76, 17, 122],
  [78, 17, 123],
  [79, 18, 123],
  [81, 18, 124],
  [82, 19, 124],
  [84, 19, 125],
  [86, 20, 125],
  [87, 21, 126],
  [89, 21, 126],
  [90, 22, 126],
  [92, 22, 127],
  [93, 23, 127],
  [95, 24, 127],
  [96, 24, 128],
  [98, 25, 128],
  [100, 26, 128],
  [101, 26, 128],
  [103, 27, 128],
  [104, 28, 129],
  [106, 28, 129],
  [107, 29, 129],
  [109, 29, 129],
  [110, 30, 129],
  [112, 31, 129],
  [114, 31, 129],
  [115, 32, 129],
  [117, 33, 129],
  [118, 33, 129],
  [120, 34, 129],
  [121, 34, 130],
  [123, 35, 130],
  [124, 35, 130],
  [126, 36, 130],
  [128, 37, 130],
  [129, 37, 129],
  [131, 38, 129],
  [132, 38, 129],
  [134, 39, 129],
  [136, 39, 129],
  [137, 40, 129],
  [139, 41, 129],
  [140, 41, 129],
  [142, 42, 129],
  [144, 42, 129],
  [145, 43, 129],
  [147, 43, 128],
  [148, 44, 128],
  [150, 44, 128],
  [152, 45, 128],
  [153, 45, 128],
  [155, 46, 127],
  [156, 46, 127],
  [158, 47, 127],
  [160, 47, 127],
  [161, 48, 126],
  [163, 48, 126],
  [165, 49, 126],
  [166, 49, 125],
  [168, 50, 125],
  [170, 51, 125],
  [171, 51, 124],
  [173, 52, 124],
  [174, 52, 123],
  [176, 53, 123],
  [178, 53, 123],
  [179, 54, 122],
  [181, 54, 122],
  [183, 55, 121],
  [184, 55, 121],
  [186, 56, 120],
  [188, 57, 120],
  [189, 57, 119],
  [191, 58, 119],
  [192, 58, 118],
  [194, 59, 117],
  [196, 60, 117],
  [197, 60, 116],
  [199, 61, 115],
  [200, 62, 115],
  [202, 62, 114],
  [204, 63, 113],
  [205, 64, 113],
  [207, 64, 112],
  [208, 65, 111],
  [210, 66, 111],
  [211, 67, 110],
  [213, 68, 109],
  [214, 69, 108],
  [216, 69, 108],
  [217, 70, 107],
  [219, 71, 106],
  [220, 72, 105],
  [222, 73, 104],
  [223, 74, 104],
  [224, 76, 103],
  [226, 77, 102],
  [227, 78, 101],
  [228, 79, 100],
  [229, 80, 100],
  [231, 82, 99],
  [232, 83, 98],
  [233, 84, 98],
  [234, 86, 97],
  [235, 87, 96],
  [236, 88, 96],
  [237, 90, 95],
  [238, 91, 94],
  [239, 93, 94],
  [240, 95, 94],
  [241, 96, 93],
  [242, 98, 93],
  [242, 100, 92],
  [243, 101, 92],
  [244, 103, 92],
  [244, 105, 92],
  [245, 107, 92],
  [246, 108, 92],
  [246, 110, 92],
  [247, 112, 92],
  [247, 114, 92],
  [248, 116, 92],
  [248, 118, 92],
  [249, 120, 93],
  [249, 121, 93],
  [249, 123, 93],
  [250, 125, 94],
  [250, 127, 94],
  [250, 129, 95],
  [251, 131, 95],
  [251, 133, 96],
  [251, 135, 97],
  [252, 137, 97],
  [252, 138, 98],
  [252, 140, 99],
  [252, 142, 100],
  [252, 144, 101],
  [253, 146, 102],
  [253, 148, 103],
  [253, 150, 104],
  [253, 152, 105],
  [253, 154, 106],
  [253, 155, 107],
  [254, 157, 108],
  [254, 159, 109],
  [254, 161, 110],
  [254, 163, 111],
  [254, 165, 113],
  [254, 167, 114],
  [254, 169, 115],
  [254, 170, 116],
  [254, 172, 118],
  [254, 174, 119],
  [254, 176, 120],
  [254, 178, 122],
  [254, 180, 123],
  [254, 182, 124],
  [254, 183, 126],
  [254, 185, 127],
  [254, 187, 129],
  [254, 189, 130],
  [254, 191, 132],
  [254, 193, 133],
  [254, 194, 135],
  [254, 196, 136],
  [254, 198, 138],
  [254, 200, 140],
  [254, 202, 141],
  [254, 204, 143],
  [254, 205, 144],
  [254, 207, 146],
  [254, 209, 148],
  [254, 211, 149],
  [254, 213, 151],
  [254, 215, 153],
  [254, 216, 154],
  [253, 218, 156],
  [253, 220, 158],
  [253, 222, 160],
  [253, 224, 161],
  [253, 226, 163],
  [253, 227, 165],
  [253, 229, 167],
  [253, 231, 169],
  [253, 233, 170],
  [253, 235, 172],
  [252, 236, 174],
  [252, 238, 176],
  [252, 240, 178],
  [252, 242, 180],
  [252, 244, 182],
  [252, 246, 184],
  [252, 247, 185],
  [252, 249, 187],
  [252, 251, 189],
  [252, 253, 191],
];
var jet = [
  [0, 0, 128],
  [0, 0, 132],
  [0, 0, 137],
  [0, 0, 141],
  [0, 0, 146],
  [0, 0, 150],
  [0, 0, 155],
  [0, 0, 159],
  [0, 0, 164],
  [0, 0, 168],
  [0, 0, 173],
  [0, 0, 178],
  [0, 0, 182],
  [0, 0, 187],
  [0, 0, 191],
  [0, 0, 196],
  [0, 0, 200],
  [0, 0, 205],
  [0, 0, 209],
  [0, 0, 214],
  [0, 0, 218],
  [0, 0, 223],
  [0, 0, 227],
  [0, 0, 232],
  [0, 0, 237],
  [0, 0, 241],
  [0, 0, 246],
  [0, 0, 250],
  [0, 0, 255],
  [0, 0, 255],
  [0, 0, 255],
  [0, 0, 255],
  [0, 0, 255],
  [0, 4, 255],
  [0, 8, 255],
  [0, 12, 255],
  [0, 16, 255],
  [0, 20, 255],
  [0, 24, 255],
  [0, 28, 255],
  [0, 32, 255],
  [0, 36, 255],
  [0, 40, 255],
  [0, 44, 255],
  [0, 48, 255],
  [0, 52, 255],
  [0, 56, 255],
  [0, 60, 255],
  [0, 64, 255],
  [0, 68, 255],
  [0, 72, 255],
  [0, 76, 255],
  [0, 80, 255],
  [0, 84, 255],
  [0, 88, 255],
  [0, 92, 255],
  [0, 96, 255],
  [0, 100, 255],
  [0, 104, 255],
  [0, 108, 255],
  [0, 112, 255],
  [0, 116, 255],
  [0, 120, 255],
  [0, 124, 255],
  [0, 128, 255],
  [0, 132, 255],
  [0, 136, 255],
  [0, 140, 255],
  [0, 144, 255],
  [0, 148, 255],
  [0, 152, 255],
  [0, 156, 255],
  [0, 160, 255],
  [0, 164, 255],
  [0, 168, 255],
  [0, 172, 255],
  [0, 176, 255],
  [0, 180, 255],
  [0, 184, 255],
  [0, 188, 255],
  [0, 192, 255],
  [0, 196, 255],
  [0, 200, 255],
  [0, 204, 255],
  [0, 208, 255],
  [0, 212, 255],
  [0, 216, 255],
  [0, 220, 254],
  [0, 224, 251],
  [0, 228, 248],
  [2, 232, 244],
  [6, 236, 241],
  [9, 240, 238],
  [12, 244, 235],
  [15, 248, 231],
  [19, 252, 228],
  [22, 255, 225],
  [25, 255, 222],
  [28, 255, 219],
  [31, 255, 215],
  [35, 255, 212],
  [38, 255, 209],
  [41, 255, 206],
  [44, 255, 202],
  [48, 255, 199],
  [51, 255, 196],
  [54, 255, 193],
  [57, 255, 190],
  [60, 255, 186],
  [64, 255, 183],
  [67, 255, 180],
  [70, 255, 177],
  [73, 255, 173],
  [77, 255, 170],
  [80, 255, 167],
  [83, 255, 164],
  [86, 255, 160],
  [90, 255, 157],
  [93, 255, 154],
  [96, 255, 151],
  [99, 255, 148],
  [102, 255, 144],
  [106, 255, 141],
  [109, 255, 138],
  [112, 255, 135],
  [115, 255, 131],
  [119, 255, 128],
  [122, 255, 125],
  [125, 255, 122],
  [128, 255, 119],
  [131, 255, 115],
  [135, 255, 112],
  [138, 255, 109],
  [141, 255, 106],
  [144, 255, 102],
  [148, 255, 99],
  [151, 255, 96],
  [154, 255, 93],
  [157, 255, 90],
  [160, 255, 86],
  [164, 255, 83],
  [167, 255, 80],
  [170, 255, 77],
  [173, 255, 73],
  [177, 255, 70],
  [180, 255, 67],
  [183, 255, 64],
  [186, 255, 60],
  [190, 255, 57],
  [193, 255, 54],
  [196, 255, 51],
  [199, 255, 48],
  [202, 255, 44],
  [206, 255, 41],
  [209, 255, 38],
  [212, 255, 35],
  [215, 255, 31],
  [219, 255, 28],
  [222, 255, 25],
  [225, 255, 22],
  [228, 255, 19],
  [231, 255, 15],
  [235, 255, 12],
  [238, 255, 9],
  [241, 252, 6],
  [244, 248, 2],
  [248, 245, 0],
  [251, 241, 0],
  [254, 237, 0],
  [255, 234, 0],
  [255, 230, 0],
  [255, 226, 0],
  [255, 222, 0],
  [255, 219, 0],
  [255, 215, 0],
  [255, 211, 0],
  [255, 208, 0],
  [255, 204, 0],
  [255, 200, 0],
  [255, 196, 0],
  [255, 193, 0],
  [255, 189, 0],
  [255, 185, 0],
  [255, 182, 0],
  [255, 178, 0],
  [255, 174, 0],
  [255, 171, 0],
  [255, 167, 0],
  [255, 163, 0],
  [255, 159, 0],
  [255, 156, 0],
  [255, 152, 0],
  [255, 148, 0],
  [255, 145, 0],
  [255, 141, 0],
  [255, 137, 0],
  [255, 134, 0],
  [255, 130, 0],
  [255, 126, 0],
  [255, 122, 0],
  [255, 119, 0],
  [255, 115, 0],
  [255, 111, 0],
  [255, 108, 0],
  [255, 104, 0],
  [255, 100, 0],
  [255, 96, 0],
  [255, 93, 0],
  [255, 89, 0],
  [255, 85, 0],
  [255, 82, 0],
  [255, 78, 0],
  [255, 74, 0],
  [255, 71, 0],
  [255, 67, 0],
  [255, 63, 0],
  [255, 59, 0],
  [255, 56, 0],
  [255, 52, 0],
  [255, 48, 0],
  [255, 45, 0],
  [255, 41, 0],
  [255, 37, 0],
  [255, 34, 0],
  [255, 30, 0],
  [255, 26, 0],
  [255, 22, 0],
  [255, 19, 0],
  [250, 15, 0],
  [246, 11, 0],
  [241, 8, 0],
  [237, 4, 0],
  [232, 0, 0],
  [228, 0, 0],
  [223, 0, 0],
  [218, 0, 0],
  [214, 0, 0],
  [209, 0, 0],
  [205, 0, 0],
  [200, 0, 0],
  [196, 0, 0],
  [191, 0, 0],
  [187, 0, 0],
  [182, 0, 0],
  [178, 0, 0],
  [173, 0, 0],
  [168, 0, 0],
  [164, 0, 0],
  [159, 0, 0],
  [155, 0, 0],
  [150, 0, 0],
  [146, 0, 0],
  [141, 0, 0],
  [137, 0, 0],
  [132, 0, 0],
  [128, 0, 0],
];
var binary = [
  [255, 255, 255],
  [254, 254, 254],
  [253, 253, 253],
  [252, 252, 252],
  [251, 251, 251],
  [250, 250, 250],
  [249, 249, 249],
  [248, 248, 248],
  [247, 247, 247],
  [246, 246, 246],
  [245, 245, 245],
  [244, 244, 244],
  [243, 243, 243],
  [242, 242, 242],
  [241, 241, 241],
  [240, 240, 240],
  [239, 239, 239],
  [238, 238, 238],
  [237, 237, 237],
  [236, 236, 236],
  [235, 235, 235],
  [234, 234, 234],
  [233, 233, 233],
  [232, 232, 232],
  [231, 231, 231],
  [230, 230, 230],
  [229, 229, 229],
  [228, 228, 228],
  [227, 227, 227],
  [226, 226, 226],
  [225, 225, 225],
  [224, 224, 224],
  [223, 223, 223],
  [222, 222, 222],
  [221, 221, 221],
  [220, 220, 220],
  [219, 219, 219],
  [218, 218, 218],
  [217, 217, 217],
  [216, 216, 216],
  [215, 215, 215],
  [214, 214, 214],
  [213, 213, 213],
  [212, 212, 212],
  [211, 211, 211],
  [210, 210, 210],
  [209, 209, 209],
  [208, 208, 208],
  [207, 207, 207],
  [206, 206, 206],
  [205, 205, 205],
  [204, 204, 204],
  [203, 203, 203],
  [202, 202, 202],
  [201, 201, 201],
  [200, 200, 200],
  [199, 199, 199],
  [198, 198, 198],
  [197, 197, 197],
  [196, 196, 196],
  [195, 195, 195],
  [194, 194, 194],
  [193, 193, 193],
  [192, 192, 192],
  [191, 191, 191],
  [190, 190, 190],
  [189, 189, 189],
  [188, 188, 188],
  [187, 187, 187],
  [186, 186, 186],
  [185, 185, 185],
  [184, 184, 184],
  [183, 183, 183],
  [182, 182, 182],
  [181, 181, 181],
  [180, 180, 180],
  [179, 179, 179],
  [178, 178, 178],
  [177, 177, 177],
  [176, 176, 176],
  [175, 175, 175],
  [174, 174, 174],
  [173, 173, 173],
  [172, 172, 172],
  [171, 171, 171],
  [170, 170, 170],
  [169, 169, 169],
  [168, 168, 168],
  [167, 167, 167],
  [166, 166, 166],
  [165, 165, 165],
  [164, 164, 164],
  [163, 163, 163],
  [162, 162, 162],
  [161, 161, 161],
  [160, 160, 160],
  [159, 159, 159],
  [158, 158, 158],
  [157, 157, 157],
  [156, 156, 156],
  [155, 155, 155],
  [154, 154, 154],
  [153, 153, 153],
  [152, 152, 152],
  [151, 151, 151],
  [150, 150, 150],
  [149, 149, 149],
  [148, 148, 148],
  [147, 147, 147],
  [146, 146, 146],
  [145, 145, 145],
  [144, 144, 144],
  [143, 143, 143],
  [142, 142, 142],
  [141, 141, 141],
  [140, 140, 140],
  [139, 139, 139],
  [138, 138, 138],
  [137, 137, 137],
  [136, 136, 136],
  [135, 135, 135],
  [134, 134, 134],
  [133, 133, 133],
  [132, 132, 132],
  [131, 131, 131],
  [130, 130, 130],
  [129, 129, 129],
  [128, 128, 128],
  [127, 127, 127],
  [126, 126, 126],
  [125, 125, 125],
  [124, 124, 124],
  [123, 123, 123],
  [122, 122, 122],
  [121, 121, 121],
  [120, 120, 120],
  [119, 119, 119],
  [118, 118, 118],
  [117, 117, 117],
  [116, 116, 116],
  [115, 115, 115],
  [114, 114, 114],
  [113, 113, 113],
  [112, 112, 112],
  [111, 111, 111],
  [110, 110, 110],
  [109, 109, 109],
  [108, 108, 108],
  [107, 107, 107],
  [106, 106, 106],
  [105, 105, 105],
  [104, 104, 104],
  [103, 103, 103],
  [102, 102, 102],
  [101, 101, 101],
  [100, 100, 100],
  [99, 99, 99],
  [98, 98, 98],
  [97, 97, 97],
  [96, 96, 96],
  [95, 95, 95],
  [94, 94, 94],
  [93, 93, 93],
  [92, 92, 92],
  [91, 91, 91],
  [90, 90, 90],
  [89, 89, 89],
  [88, 88, 88],
  [87, 87, 87],
  [86, 86, 86],
  [85, 85, 85],
  [84, 84, 84],
  [83, 83, 83],
  [82, 82, 82],
  [81, 81, 81],
  [80, 80, 80],
  [79, 79, 79],
  [78, 78, 78],
  [77, 77, 77],
  [76, 76, 76],
  [75, 75, 75],
  [74, 74, 74],
  [73, 73, 73],
  [72, 72, 72],
  [71, 71, 71],
  [70, 70, 70],
  [69, 69, 69],
  [68, 68, 68],
  [67, 67, 67],
  [66, 66, 66],
  [65, 65, 65],
  [64, 64, 64],
  [63, 63, 63],
  [62, 62, 62],
  [61, 61, 61],
  [60, 60, 60],
  [59, 59, 59],
  [58, 58, 58],
  [57, 57, 57],
  [56, 56, 56],
  [55, 55, 55],
  [54, 54, 54],
  [53, 53, 53],
  [52, 52, 52],
  [51, 51, 51],
  [50, 50, 50],
  [49, 49, 49],
  [48, 48, 48],
  [47, 47, 47],
  [46, 46, 46],
  [45, 45, 45],
  [44, 44, 44],
  [43, 43, 43],
  [42, 42, 42],
  [41, 41, 41],
  [40, 40, 40],
  [39, 39, 39],
  [38, 38, 38],
  [37, 37, 37],
  [36, 36, 36],
  [35, 35, 35],
  [34, 34, 34],
  [33, 33, 33],
  [32, 32, 32],
  [31, 31, 31],
  [30, 30, 30],
  [29, 29, 29],
  [28, 28, 28],
  [27, 27, 27],
  [26, 26, 26],
  [25, 25, 25],
  [24, 24, 24],
  [23, 23, 23],
  [22, 22, 22],
  [21, 21, 21],
  [20, 20, 20],
  [19, 19, 19],
  [18, 18, 18],
  [17, 17, 17],
  [16, 16, 16],
  [15, 15, 15],
  [14, 14, 14],
  [13, 13, 13],
  [12, 12, 12],
  [11, 11, 11],
  [10, 10, 10],
  [9, 9, 9],
  [8, 8, 8],
  [7, 7, 7],
  [6, 6, 6],
  [5, 5, 5],
  [4, 4, 4],
  [3, 3, 3],
  [2, 2, 2],
  [1, 1, 1],
  [0, 0, 0],
];
var colormaps = [turbo, fosphor, viridis, inferno, magma, jet, binary];
