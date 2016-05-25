var assert = require('assert'),
util = require('util'),
spawn = require('child_process').spawn;
gazebojs = require('../index');

var camera_uri = 'model://camera';
var sensor_uri = 'model://hokuyo';
var model_uri = 'model://cube_20k';

suite('topics', function() {

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

// Test receiving Sensor msgs on sensor topic.
test('sensor topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Sensor', '~/sensor', function(e,d){
        console.log(d);
        assert(d.name == 'laser');
        gazebo.unsubscribe('~/sensor');
        done();
    });
    gazebo.sim.spawn(sensor_uri, 'hokuyo');
});

// Test receiving Visual msgs on visual topic.
test('visual topic', function(done) {
    gazebo.subscribe('gazebo.msgs.Visual', '~/visual', function(e,d){
        console.log(d);
        assert(d.name == 'hokuyo');
        gazebo.unsubscribe('~/visual');
        done();
    });
    gazebo.sim.spawn(sensor_uri, 'hokuyo');
});

// Test receiving Camera msgs on camera topic.
// test('camera topic', function(done) {
//     gazebo.subscribe('gazebo.msgs.Camera', '~/camera', function(e,d){
//         console.log(d);
//         assert(d.name != '');
//         gazebo.unsubscribe('~/camera');
//         done();
//     });
//     gazebo.sim.spawn(camera_uri, 'camera');
// });

// // Test receiving Model msgs on model topic.
// test('model info topic', function(done) {
//     gazebo.subscribe('gazebo.msgs.Model', '~/model', function(e,d){
//         console.log(d);
//         assert(d.name != '');
//         gazebo.unsubscribe('~/model');
//         done();
//     });
//     gazebo.sim.spawn(sensor_uri, 'cube_20k');
// });

suiteTeardown(function() {
    console.log('suiteTeardown');
    gzserver.kill('SIGHUP');
});

});
