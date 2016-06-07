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

// This test is to see how fast can we process msgs from a topic.
// This would be a key to replace gzbridge by gazebojs, if the performaance
// turns out to be not good we wont be aable to do it then.

// Do i need advertise ?, it would allow me to set the frequency of publishing msgs.

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

// Test receiving Visual msgs on visual topic.
test('World stats topic', function(done) {
  var counter = 0;
    gazebo.subscribe('gazebo.msgs.WorldStatistics', '~/world_stats', function(e,d){
        assert(d.name != '');
        counter++;
        console.log(counter);
    });
    gazebo.sim.spawn(sensor_uri, 'hokuyo');
    if (counter > 1000){
        gazebo.unsubscribe('~/world_stats');
        done();
      }
});

suiteTeardown(function() {
    console.log('suiteTeardown');
    gzserver.kill('SIGHUP');
});

});