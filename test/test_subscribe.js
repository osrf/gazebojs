const assert = require('assert')
const spawn = require('child_process').spawn
const gazebojs = require('../index')
const timing = require('./timing.js').fast

suite('subscribe', function() {

    var gzserver;
    var gazebo;

    this.timeout(timing.test);

    suiteSetup (function(done){

        gzserver = spawn('gzserver', ['--verbose']);
        gzserver.on('data', (data) => { console.log('gz: ' + data) })
        // give a second for gzserver to come up
        setTimeout(()=> {
            gazebo = new gazebojs.Gazebo();
            gazebo.proc = gzserver
            console.log('sim pid: ' + gazebo.proc.pid)
            done();
        }, timing.spawn);
    });

    // Test default subscribe.
    test('toJson set to false', function(done) {
        gazebo.subscribe("gazebo.msgs.WorldStatistics", "~/world_stats", function(e,d){
            gazebo.unsubscribe('~/world_stats');
            var type = typeof d;
            if(type === 'string'){
                done();
            }else{
                assert.fail('string', 'json', 'Returned a wrong type, return type not string', '!=');
            }
        },{'toJson': false});
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
