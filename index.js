
var gz = require('./build/Release/gazebo');
var fs = require('fs');
var Jpeg = require('jpeg').Jpeg; 
var Png = require('png').Png;

exports.ImageFormats = ['UNKNOWN_PIXEL_FORMAT', 'L_INT8', 'L_INT16', 'RGB_INT8',
   'RGBA_INT8', 'BGRA_INT8', 'RGB_INT16', 'RGB_INT32', 'BGR_INT8', 'BGR_INT16',
   'BGR_INT32', 'R_FLOAT16', 'RGB_FLOAT16', 'R_FLOAT32', 'RGB_FLOAT32',
   'BAYER_RGGB8','BAYER_RGGR8', 'BAYER_GBRG8', 'BAYER_GRBG8'];



function Gazebo (options) {
    this.sim = new gz.Sim();
}

Gazebo.prototype.pause = function() {
    this.sim.pause();
}

Gazebo.prototype.play = function() {
    this.sim.play();
}


Gazebo.prototype.subscribe = function(type, topic, cb, options) {
    var latch = false;
    var toJson = true;
    if(options){
        if (options['toJson']) toJson = options.toJson;
        if (options['latch']) latch = options.latch;
    }
    this.sim.subscribe(type, topic, function(err, data) {
        if(err){
            cb(err);
            return;
        }

        var result = data;
	// parse the string into a json msg
        if(toJson) {
            result = JSON.parse(data);
        }
        cb(err, result);

    }, latch);
}

Gazebo.prototype.subscribeToImageTopic = function(topic, cb , options) {
    
    var format = 'jpeg';
    var encoding = 'binary';

    if(options) {
        if (options['format'])
        {
            if (!options['format'] in ['png', 'jpeg'])
                throw "Format not supported. Choices are: jpeg (default) or png";
        }
        else {
            format = options['format'];
        }
        if (options['encoding']) {
            if (!options['encoding'] in ['base64', 'binary'])
                throw "Encoding not supported. Choices are: binary (default) or base64"
        }
    }
    var type = 'gazebo.msgs.ImageStamped';
    this.subscribe(type, topic, function(err, image_msg) {

        if (err) {
            cb(err);
        }
        else {
            var image = image_msg.image;
            var rgb = new Buffer(image.data, 'base64');
            if(format == 'jpeg') {
                var jpeg = new Jpeg(rgb, image.width, image.height);
                jpeg.encode(function (img, error) {
                    if(error) {
                        cb(error);
                    } else {
                        var data = img.toString(encoding); // base64
                        
                        cb(null, data);
                    }
                });
            }
            if(format =='png')  {
                var png = new Png(rgb, image.width, image.height);
                png.encode(function (img, error) {
                     if(error) {
                         cb(error);
                     } else {
                         // var data = jpeg_img.toString(encoding); // base64
                         cb(null, img);
                     }
                 });
            }
        }
    });
}

Gazebo.prototype.pixel_format = function (nb) {
    return gz_formats[nb];
}


Gazebo.prototype.unsubscribe = function(topic) {
  return this.sim.unsubscribe(topic);
}

Gazebo.prototype.publish = function (type, topic, msg, options) {
    var str = JSON.stringify(msg);
    this.sim.publish(type, topic, str);
}

Gazebo.prototype.model = function(model_name, cb) {
    var modelFile = this.sim.modelFile(model_name);
    fs.readFile(modelFile, function(err, data){
        var str = '';
        if(data){
            // fs returns a Buffer, get a string instead
            str = data.toString('utf8');
        }
        // serve it
        cb(err, str);
    });
}


exports.Gazebo = Gazebo;

exports.connect = function (options ) {
    return new Gazebo(options);
}

// test for publish
// var gazebo = new ( require('./index')).Gazebo(); gazebo.publish("gazebo.msgs.WorldControl",  "~/world_control", {pause:true});

// test for subscribe
// var gazebo = new ( require('./index')).Gazebo(); var m = []; gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){m.push(d)});

// test for g.subscribeToImageTopic 
// var gz = require('gazebojs'); var fs = require('fs'); var g = new gz.Gazebo();
// var img=[]; g.subscribeToImageTopic('~/camera/link/camera/image', function(e, i){img = i ;})


