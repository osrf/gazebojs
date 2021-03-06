const assert = require('assert')
const  spawn = require('child_process').spawn
const  gazebojs = require('../index')
const timing = require('./timing.js').move

suite('movement', function() {

    var gzserver;
    var gazebo;

    this.timeout(timing.test);

    suiteSetup (function(done){


        gzserver = spawn('gzserver', [ __dirname + '/../examples/pendulum_cam.world']);
        gzserver.on('data', (data) => { console.log('gz: ' + data) })
        // give a second for gzserver to come up
        setTimeout(()=> {

            gazebo = new gazebojs.Gazebo();
            gazebo.proc = gzserver
            console.log('sim pid: ' + gazebo.proc.pid)
            done();
        }, timing.spawn);
    });

    // Test receiving pose msgs from a moving model.
    test('receiving msgs from a moving model', function(done) {
        first = true;
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,d){
            if(first){
                old_orientation = d.pose[2].orientation;
            }
            else{
                new_orientation = d.pose[2].orientation;
                gazebo.unsubscribe('~/pose/info');
                if(old_orientation.x!==new_orientation.x || old_orientation.y!==new_orientation.y
                    || old_orientation.w!==new_orientation.w || old_orientation.z!==new_orientation.z){
                    done();
                }
                else{
                    assert.fail(old_orientation, new_orientation, 'model not moving','=');
                }
            }
            first = false;
        });
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
