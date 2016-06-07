var assert = require('assert'),
util = require('util'),
spawn = require('child_process').spawn;
gazebojs = require('../index');

suite('performance', function() {

// This test is to see how fast can we process msgs from a topic.
// This would be a key to replace gzbridge by gazebojs, if the performance
// turns out to be not good we wont be aable to do it then.

// Do i need advertise ?, it would allow me to set the frequency of publishing msgs.

var gzserver;
var gazebo;

this.timeout(5000);

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

  // This Warrning appears in gzserver after sth like 5 minutes of running: [Wrn] [Publisher.cc:140] 
  // Queue limit reached for topic /gazebo/default/pose/local/info, deleting message. This warning is printed only once

  // TODO: a read test has to be done, we are just counting the number of recieved msgs on the topin in a 4sec interval.
  // How fast can gazebojs process msgs from a certain topic.
  test('Reciving msgs', function(done) {
    first = true;
    counter = 0;
    gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,d){
        counter ++;
        setTimeout(()=> {
            console.log(counter)
            gazebo.unsubscribe('~/pose/info');
  // We do need to add some sort of a condtion.
            done();            
        }, 4000);
    });
});

  suiteTeardown(function() {
    console.log('suiteTeardown');
    gzserver.kill('SIGHUP');
});

});