
var gz = require('./build/Release/gazebo');
var fs = require('fs');
var Jpeg = require('jpeg').Jpeg; 
var Png = require('png').Png;


// the options determine how a message is filtered
//  - timeElapsed: a message cannot be ignored if is older than this value
//  - distance: a message cannot be ignored if translation is larger than this value
//  - quaternion: a message cannot be ignored if the dot product of the quaternion
//    is larger than this value.
function PosesFilter (options) {
    this.poseMap = {};

    this.timeElapsed = 0;
    this.distance = 0;
    this.quaternion = 0;

    if(options.timeElapsed) {
        this.timeElapsed = options.timeElapsed;
        this.nsec = 1e9 * this.timeElapsed;

    }
    if(options.distance) {
        this.distance = options.distance;
        this.d2 = this.distance * this.distance;
    }
    if(options.quaternion) {
        this.quaternion = options.quaternion;
    }

}

exports.PosesFilter = PosesFilter;

PosesFilter.prototype.hasMoved = function(oldPosition, position, dist)
{
    return True;
}

PosesFilter.prototype.hasTurned = function(oldOrientation, orientation, quat)
{
    return True;
}

PosesFilter.prototype.isOld = function(oldTime, newTime, nsecs)
{
    return True;
}

PosesFilter.prototype.addPosesStamped = function(posesStamped) {
    var unfilteredMsgs = [];
    var newTime = posesStamped.time;
    posesStamped.pose.forEach(function (pose) {
        var newMsg = {time:newTime, position:pose.position, orientation:pose.orientation};
        var lastMsg = this.PoseMap[pose.id];
        var filtered = true;
        if(!lastMsg) {
            filtered = false;
        }
        else {
            var old = this.isOld(lastMsg.time, newMsg.time, this.nsec);
            var far = this.hasMoved(lastMsg.position, newMsg.position, this.d2);
            var twisted = this.hasTurned(lastMsg.orientation, newMsg.orientation, this.quaternion);
            if(old || far || twisted) {
                filtered = false;    
            }
        }
        if (!filtered) {
            this.PoseMap[pose.id] = newMsg;
            unfilteredMsgs.push(m);
        }
    });
    return unfilteredMsgs;
}



var gz_formats = ['UNKNOWN_PIXEL_FORMAT', 'L_INT8', 'L_INT16', 'RGB_INT8',
   'RGBA_INT8', 'BGRA_INT8', 'RGB_INT16', 'RGB_INT32', 'BGR_INT8', 'BGR_INT16',
   'BGR_INT32', 'R_FLOAT16', 'RGB_FLOAT16', 'R_FLOAT32', 'RGB_FLOAT32',
   'BAYER_RGGB8','BAYER_RGGR8', 'BAYER_GBRG8', 'BAYER_GRBG8'];

function Gazebo (options) {
    this.sim = new gz.Sim();
}

exports.Gazebo = Gazebo;

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



Gazebo.prototype.subscribeToFilteredPose = function(topic, cb, options) {
    var m;
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


