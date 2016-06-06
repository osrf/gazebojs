var assert = require('assert'),
util = require('util'),
spawn = require('child_process').spawn;
gazebojs = require('../index');

var camera_uri = 'model://camera';
var sensor_uri = 'model://hokuyo';
var model_uri = 'model://cube_20k';
var kinect_uri = 'model://kinect';
var pioneer2dx_uri = 'model://pioneer2dx'; 

suite('topics', function() {

  // // Topics not sure how are they being published
  // this->linkTopic = "~/link";
  // this->sceneTopic = "~/scene";
  //this->physicsTopic = "~/physics";
  // this->materialTopic = "~/material";
  // this->deleteTopic = "~/entity_delete";
  // this->requestTopic = "~/request";
  // this->heightmapService = "~/heightmap_data";
  
  // Topics to have a look at later
  // this->modelModifyTopic = "~/model/modify";
  // this->worldControlTopic = "~/world_control";
  // this->roadTopic = "~/roads";
  // this->poseTopic = "~/pose/info";
  // this->lightFactoryTopic = "~/factory/light";
  // this->lightModifyTopic = "~/light/modify";
  var gzserver;
  var gazebo;

  this.timeout(5000);

  suiteSetup (function(done){

        // console.log('suiteSetup');
        gzserver = spawn('gzserver', ['--verbose']);
        gzserver.on('data', (data) => { console.log('gz: ' + data) })
        // give a second for gzserver to come up
        setTimeout(()=> {
            gazebo = new gazebojs.Gazebo();
            gazebo.proc = gzserver
            console.log('sim pid: ' + gazebo.proc.pid)
            done();
        }, 100);
    });

// TODO
// the test on the top ALWAYS fails.
test('dummy test', function(done) {
    gazebo.sim.spawn(sensor_uri, 'hokuyo');
    gazebo.subscribe('gazebo.msgs.Visual', '~/visual', function(e,d){
        console.log(d);
        assert(d.name != '');
        gazebo.unsubscribe('~/visual');
        done();
    });
    gazebo.sim.spawn(sensor_uri, 'hokuyo');
});

// Test receiving Joint msgs on joint topic.
test('joint topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Joint', '~/joint', function(e,d){
        console.log(d);
        assert(d.name != '');
        gazebo.unsubscribe('~/joint');
        done();
    });
    gazebo.sim.spawn(pioneer2dx_uri, 'pioneer2dx');
});

// Test receiving factory msgs on factory topic.
test('factory topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Factory', '~/factory', function(e,d){
        console.log(d);
        assert(d.name != '');
        gazebo.unsubscribe('~/factory');
        done();
    });
    gazebo.sim.spawn(pioneer2dx_uri, 'pioneer2dx');
});

// Test receiving Visual msgs on visual topic.
test('visual topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Visual', '~/visual', function(e,d){
        console.log(d);
        assert(d.name != '');
        gazebo.unsubscribe('~/visual');
        done();
    });
    gazebo.sim.spawn(sensor_uri, 'hokuyo');
});

// Test receiving Sensor msgs on sensor topic.
test('sensor topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Sensor', '~/sensor', function(e,d){
        console.log(d);
        assert(d.name != '');
        gazebo.unsubscribe('~/sensor');
        done();
    });
    gazebo.sim.spawn(kinect_uri, 'kinect');
});

// Test receiving Model msgs on model topic.
test('model info topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Model', '~/model/info', function(e,d){
        console.log(d);
        assert(d.name != '');
        gazebo.unsubscribe('~/model/info');
        done();
    });
    gazebo.sim.spawn(model_uri, 'cube_20k');
});

suiteTeardown(function() {
    console.log('suiteTeardown');
    gzserver.kill('SIGHUP');
});

});