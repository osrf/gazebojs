'use strict'


// to complie in debug mode, use
// node-gyp configure --debug
// and select the module in the debug dir:
// var gz = require('./build/Debug/gazebo');

let gz = require('./build/Release/gazebo');

let Jimp = require('jimp');
let PNG = require('pngjs').PNG
let streamToBuffer = require('stream-to-buffer')
var random = require("random-js")(); // uses the nativeMath engine

var fs = require('fs');
// var Png = require('png').Png;
// var Jpeg = require('jpeg').Jpeg;
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
        var newMsg = {name:pose.name, time:newTime, position:pose.position, orientation:pose.orientation};
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
    console.log( 'message compression:'+ p + '% (' + this.msgCount + ' total)' );
}


var gz_formats = ['UNKNOWN_PIXEL_FORMAT', 'L_INT8', 'L_INT16', 'RGB_INT8',
   'RGBA_INT8', 'BGRA_INT8', 'RGB_INT16', 'RGB_INT32', 'BGR_INT8', 'BGR_INT16',
   'BGR_INT32', 'R_FLOAT16', 'RGB_FLOAT16', 'R_FLOAT32', 'RGB_FLOAT32',
   'BAYER_RGGB8','BAYER_RGGR8', 'BAYER_GBRG8', 'BAYER_GRBG8'];

function Gazebo (options) {
    this.sim = new gz.Sim();
}

exports.Gazebo = Gazebo;

// Play the simulation.
Gazebo.prototype.play = function() {
    this.publish("gazebo.msgs.WorldControl",  "~/world_control", {pause:false});
}

// Pause the simulation.
Gazebo.prototype.pause = function() {
   this.publish("gazebo.msgs.WorldControl",  "~/world_control", {pause:true});
}

/// \brief Event callback used for inserting models into the editor
/// \param[in] type Type of model or model uri.
/// \param[in] name Name of model.
/// \param[in] (optional) position of the model as x,y,z.
/// \param[in] (optional) pose of the model as x,y,z,x,y,z (position then rotation).
Gazebo.prototype.spawn = function(type, name) {
    var factoryMsg = 'gazebo.msgs.Factory';
    var newModelStr = {};
    var pos = {x: 0, y:0, z:0};
    var rpy = {x: 0, y:0, z:0};

	if(arguments.length === 5)
    {
        pos.x = arguments[2];
        pos.y = arguments[3];
        pos.z = arguments[4];
    }
    else if(arguments.length === 8){
        pos.x = arguments[2];
        pos.y = arguments[3];
        pos.z = arguments[4];
        rpy.x = arguments[5];
        rpy.y = arguments[6];
        rpy.z = arguments[7];
    }

    if(type === "box" || type === "sphere" || type === "cylinder")
    {
        var geom;
        if (type === "box")
        {
          geom  = '<box>\n<size>1.0 1.0 1.0</size>\n</box>';
        }
        else if (type === "sphere")
        {
          geom  = '<sphere>\n<radius>0.5</radius>\n</sphere>';
        }
        else if (type === "cylinder")
        {
          geom  = '<cylinder>\n<radius>0.5</radius>\n<length>1.0</length>\n</cylinder>';
    }
    newModelStr = "<sdf version ='" + this.sim.sdfVersion() + "'>"
        + "\n<model name='" + name + "'>"
        + "\n<pose>" + pos.x +" " + pos.y + " " + pos.z + " "
                            + rpy.x + " " + rpy.y +" " + rpy.z + "</pose>"
        + "\n<link name ='link'>"
        +   "\n<inertial><mass>1.0</mass></inertial>"
        +   "\n<collision name ='collision'>"
        +     "\n<geometry>"
        +        '\n' + geom 
        +     "\n</geometry>"
        + "\n</collision>"
        +   "\n<visual name ='visual'>"
        +     "\n<geometry>"
        +       '\n' + geom 
        +     "\n</geometry>"
        +     "\n<material>"
        +       "\n<script>"
        +         "\n<uri>file://media/materials/scripts/gazebo.material"
        +         "\n</uri>"
        +         "\n<name>Gazebo/Grey</name>"
        +       "\n</script>"
        +     "\n</material>"
        +   "\n</visual>"
        + "\n</link>"
        + "\n</model>"
        + "\n</sdf>";
  }
  else
  {
    newModelStr = "<sdf version ='" + this.sim.sdfVersion() + "'>"
          + "<model name='" + name + "'>"
          + "  <pose>" + pos.x + " " + pos.y + " "+ pos.z 
                    + " " + rpy.x + " "   + rpy.y + " " + rpy.z + "</pose>"
          + "  <include>"
          + "    <uri>" + type + "</uri>"
          + "  </include>"
          + "</model>"
          + "</sdf>";
  }
    var msg = {sdf:newModelStr};
    // Spawn the model in the physics server
    this.publish(factoryMsg,'~/factory',msg);
};

Gazebo.prototype.deleteEntity = function(name) {
    var type = 'gazebo.msgs.Request';
    var value = random.integer(1, 1000);
    var msg = {id:value, request:'entity_delete', data: name};
    this.publish(type, '~/request', msg);
}

Gazebo.prototype.subscribe = function(type, topic, cb, options) {
    var latch = false
    var json = true
    if(options){
        if (typeof options['latch'] == "boolean") latch = options.latch
        if (typeof options['toJson'] == "boolean") json = options.toJson
    }
    this.sim.subscribe(type, topic, function(err, data) {
        if(err){
            cb(err)
            return
        }
        var result = data
        if (json) {
            // parse the string into a json msg
            result = JSON.parse(data)
        }
        cb(err, result)
    }, latch)
}


Gazebo.prototype.subscribeToImageTopic = function(topic, cb , options) {

    var format = 'jpeg'
    var quality = 50

    if(options) {
        if (options['format'])
        {
            if (!options['format'] in ['png', 'jpeg', 'bmp'])
                throw "Format not supported. Choices are: jpeg (default), bmp or png";
        }
        if (options['quality']) {
            quality = options['quality']
            if (options['format'] != ['jpeg'])
                console.log("Quality only applies to jpeg encoding. It will be ignored.")
        }
    }

    format = options['format'];
    var type = 'gazebo.msgs.ImageStamped';
    this.subscribe(type, topic, function(err, image_msg) {
        if (err) {
            cb(err);
        }
        else {
          var buffer = new Buffer(image_msg.image.data, 'base64');
          if(format == 'png') {
            var png = new PNG({
              width: image_msg.image.width,
              height: image_msg.image.height,
              bitDepth: 8,
              colorType: 6,
              inputHasAlpha: false
            });
            png.data = buffer

            streamToBuffer(png.pack(), function (err, fileBuf) {
              cb(null, fileBuf)
            })
            return
          }
          // make a larger buffer for transparent layer
          var rgbaBuffer = new Buffer(image_msg.image.width * image_msg.image.height * 4)
          var j=0
          var i=0
          //var pixData = image_msg.image.data
          var pixData = buffer
          while(i < rgbaBuffer.length){
            rgbaBuffer[i++] = pixData[j++]
            rgbaBuffer[i++] = pixData[j++]
            rgbaBuffer[i++] = pixData[j++]
            rgbaBuffer[i++] = 255 // alpha
          }
          var x = new Jimp(image_msg.image.width, image_msg.image.height, function (err, image) {
            image.bitmap.data = rgbaBuffer
            // image.write( 'jimp.jpg', console.log );
            // image.write( 'jimp.png', console.log );
            var datai;
            if(format == 'jpeg') {
              image.quality(quality)
              image.getBuffer(Jimp.MIME_JPEG, function(err, fileBuf) {
                // fs.writeFile('jimpx.jpeg', fileBuf, console.log)
                cb(err, fileBuf)
              })
            }
            if(format == 'bmp') {
              image.getBuffer(Jimp.MIME_BMP, function(err, fileBuf) {
                cb(err, fileBuf)
              })
            }
          });
        }
    });
}

exports.pixel_format = function (nb) {
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
    if(!cb)
       throw("No callback function specified to get sdf for: " + model_name)
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


