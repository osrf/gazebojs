var assert = require('assert'),
    util = require('util'),
    spawn = require('child_process').spawn;
    gazebojs = require('../index');


suite('subscribe', function() {

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

    // Test default subscribe.
    test('toJson" set to false', function(done) {
        gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){
            gazebo.unsubscribe('~/world_stats');
            var type = typeof d;
            if(type === 'object'){
                done();
            }else{
                assert.fail('string', 'json', 'Returned a wrong type, return type not string', '!=');
            }
        },{'toJson': false});
        gazebo.sim.spawn('box','box');
    });

    // Test with toJson set to false.
    test('default subscribe', function(done) {
        gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){
            gazebo.unsubscribe('~/world_stats');
            var type = typeof d;
            if(type === 'object'){
                done();
            }
            else{
                assert.fail('string', 'json', 'Returned a wrong type, return type not json', '!=');
            }
        });
    });

    // Test with toJson set to true.
    test('"toJson" set to true ', function(done) {
        gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){
            gazebo.unsubscribe('~/world_stats');
            var type = typeof d;
            if(type === 'object'){
                done();
            }
            else{
                assert.fail('string', 'json', 'Returned a wrong type, return type not json', '!=');
            }
        },{'toJson':true});
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
