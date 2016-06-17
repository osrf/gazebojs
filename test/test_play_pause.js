var assert = require('assert'),
    util = require('util'),
    spawn = require('child_process').spawn;
    gazebojs = require('../index');

suite('play and pause test', function() {

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

    test('test pause', function(done) {
	gazebo.subscribe("gazebo.msgs.WorldControl", "~/world_control", function(e,d){
	    if(d.pause){
		done();
		}
		gazebo.unsubscribe('~/world_control');
	});
    	gazebo.pause();
    });

    test('test play', function(done) {
	gazebo.subscribe("gazebo.msgs.WorldControl", "~/world_control", function(e,d){
		if(!d.pause){
			done();
		}
            	gazebo.unsubscribe('~/world_control');
	});
	gazebo.play();
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
