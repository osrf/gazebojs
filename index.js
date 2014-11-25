


// to complie in debug mode, use
// node-gyp configure --debug 
// and select the module in the debug dir:
// var gz = require('./build/Debug/gazebo');

var gz = require('./build/Release/gazebo');

var fs = require('fs');
var Jpeg = require('jpeg').Jpeg; 
var Png = require('png').Png;
var path = require('path');
var util = require('util');

// the options determine how a message is filtered
//  - timeElapsed: a message cannot be ignored if is older than this value
//  - distance: a message cannot be ignored if translation is larger than this value
//  - quaternion: a message cannot be ignored if the dot product of the quaternion
//    is larger than this value.
function PosesFilter (options) {
    this.reset(options);
}

exports.PosesFilter = PosesFilter;

PosesFilter.prototype.hasMoved = function(oldPosition, position, dist)
{
    var x = oldPosition.x - position.x;
    var y = oldPosition.y - position.y;
    var z = oldPosition.z - position.z;
    var translation2 = x*x + y*y + z*z 
    return translation2 > (dist * dist);
}

PosesFilter.prototype.hasTurned = function(oldOrientation, orientation, quat)
{
    var dotProduct = oldOrientation.w * orientation.w;
    dotProduct += oldOrientation.x * orientation.x;
    dotProduct += oldOrientation.y * orientation.y;
    dotProduct += oldOrientation.z * orientation.z;
    var turn = Math.abs(1 - dotProduct) >  quat;
    return turn;
}

PosesFilter.prototype.isOld = function(oldTime, newTime, nsecs)
{
    var ds = newTime.sec - oldTime.sec;
    var dn = newTime.nsec - oldTime.nsec;
    var age = ds * 1e9 + dn;
    var old =  age >  nsecs;
    return old;
} 

PosesFilter.prototype.reset = function(options) {
    this.poseMap = {};
    this.timeElapsed = 0;
    this.distance = 0;
    this.quaternion = 0;
    if(options) {
        if(options.timeElapsed) {
            this.timeElapsed = options.timeElapsed;

        }
        if(options.distance) {
            this.distance = options.distance;
        }
        if(options.quaternion) {
            this.quaternion = options.quaternion;
        }
    }
   // statistics
   this.msgCount = 0;
   this.filteredCount = 0;
}

PosesFilter.prototype.addPosesStamped = function(posesStamped) {

    var unfilteredMsgs = [];
    var newTime = posesStamped.time;
    var nsec = 1e9 * this.timeElapsed;

    for(var i=0; i < posesStamped.pose.length; i++) {
        var pose = posesStamped.pose[i];
        var newMsg = {time:newTime, position:pose.position, orientation:pose.orientation};
        var model = pose.id;
    
        var lastMsg = this.poseMap[model];
        var filtered = true;
        
        if (lastMsg) {
            var old = this.isOld(lastMsg.time, newMsg.time, nsec);
            var far = this.hasMoved(lastMsg.position, newMsg.position, this.distance);
            var twisted = this.hasTurned(lastMsg.orientation, newMsg.orientation, this.quaternion);
            // console.log(pose.name + ' old: ' + old + ' far:' + far + ' twist:' + twisted);
            if(old || far || twisted) {
                filtered = false;   
            }
        }
        if (!lastMsg || !filtered) {
            this.poseMap[pose.id] = newMsg;
            unfilteredMsgs.push(newMsg);
        }
        // stats
        if(filtered)  this.filteredCount +=1;
        this.msgCount += 1;
    }
    return unfilteredMsgs;
}

PosesFilter.prototype.stats = function() {
    var p = 100 * (this.msgCount / this.filteredCount);
    console.log( 'messag compression:'+ p + '% (' + this.msgCount + ' total)' );
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
        if(err){
            cb(err);
        }
        var str = '';
        if(data){
            // fs returns a Buffer, get a string instead
            str = data.toString('utf8');
        }
        // serve it
        cb(null, str);
    });
}


Gazebo.prototype.readFile = function(model_uri) {
    var modelFile = this.sim.findFile(model_uri);
    fs.readFile(modelFile, function(err, data){
        if(err){
            cb(err);
        }
        var str = '';
        if(data){
            // serve it as a buffer
            cb(null, data);
        }
    });

}

Gazebo.prototype.modelConfig = function(model_uri, cb){
    var p = this.sim.find_file(model_uri);
    cb(null, conf);
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


