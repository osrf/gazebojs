const spawn = require('child_process').spawn
const gazebojs = require('../index')
const timing = require('./timing.js').perf

suite('performance', function() {

// This test is to see how fast can we receive msgs from gzserver.

    var gzserver;
    var gazebo;

    var test_period_sec = timing.test_period /1000;

    this.timeout(timing.test + timing.test_period);

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

    // How fast can gazebojs process msgs from a certain topic.
    test('Receiving msgs', function(done) {
        counter = 0;
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e){
            if(!e)
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
        }, timing.test_period);
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
