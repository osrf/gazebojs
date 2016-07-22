const assert = require('assert')
const util = require('util')
const spawn = require('child_process').spawn
const gazebojs = require('../index')

suite('performance', function() {

// This test is to see how fast can we receive msgs from gzserver.

var gzserver;
var gazebo;

// Currently we are testing with 8 subscribers, more than that may require
// a time period more than 4 seconds to avoid a (core dumped) error
// [because gzserver didn't have the chance to unsubscribe].
var test_period = 4000;
var test_period_sec = test_period /1000;

this.timeout(5000+test_period);

suiteSetup (function(done){

        // console.log('suiteSetup');
        gzserver = spawn('gzserver', [ __dirname + '/../examples/pendulum_cam.world']);
        gzserver.on('data', (data) => { console.log('gz: ' + data) })
        // give a second for gzserver to come up
        setTimeout(()=> {
            gazebo = new gazebojs.Gazebo();
            gazebo.proc = gzserver
            console.log('sim pid: ' + gazebo.proc.pid)
            done();
        }, 100);
    });

    // How fast can gazebojs process msgs from a certain topic.
    test('Receiving msgs', function(done) {
        counter = 0;
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,d){
            counter ++;
        });
        setTimeout(()=> {
                var rate = counter/test_period_sec;
                console.log(counter + ' messages received in ' + test_period_sec + ' seconds, ' + rate +' messages/sec')
                gazebo.unsubscribe('~/pose/info');
                // We would consider this a minimum rate for now, could be changed later.
                if(rate < 20){
                    assert.fail(rate,20,'msgs reciving rate too slow','<');
                }
                else{
                    done();
                }
        }, test_period);
    });

      suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
      });

});
