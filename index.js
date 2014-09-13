var gz = require('./build/Release/gazebo');


function Gazebo (options) {
    this.sim = new gz.Sim();
    console.log('new Gazebo');
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

Gazebo.prototype.unsubscribe = function(topic) {
  return this.sim.unsubscribe(topic);
}

Gazebo.prototype.publish = function (type, topic, msg, options) {
    var str = JSON.stringify(msg);
    this.sim.publish(type, topic, str);
}


exports.Gazebo = Gazebo;

exports.connect = function (options ) {
    return new Gazebo(options);
}

// test for publish
// var gazebo = new ( require('./index')).Gazebo(); gazebo.publish("gazebo.msgs.WorldControl",  "~/world_control", {pause:true});
// test for subscribe
// var gazebo = new ( require('./index')).Gazebo(); var m = []; gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){m.push(d)});
 


