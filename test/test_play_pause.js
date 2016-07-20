const assert = require('assert')
const util = require('util')
const spawn = require('child_process').spawn
const gazebojs = require('../index')

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
        var first_check = false;
	gazebo.subscribe("gazebo.msgs.WorldControl", "~/world_control", function(e,d){
	     if(d.pause){
		first_check = true;
	     }
	     gazebo.unsubscribe('~/world_control');
           });
            gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){
                if(d.paused && first_check){
                    done();
                }
           });
        setTimeout(()=> {
            gazebo.pause();
        }, 1000);
    });

    test('test play', function(done) {
        var first_check = false;
            gazebo.subscribe("gazebo.msgs.WorldControl", "~/world_control", function(e,d){
	    if(!d.pause){
	         first_check = true;
	     }
                gazebo.unsubscribe('~/world_control');
            });
            gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){
               if(!d.paused && first_check){
                    done();
               }
            });
	gazebo.play();
    });

    suiteTeardown(function() {
        gazebo.unsubscribe('~/world_stats');
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
