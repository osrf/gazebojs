var assert = require('assert'),
    util = require('util'),
    spawn = require('child_process').spawn;
    gazebojs = require('../index');


suite('topics list', function() {

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

    // Test retrieval of topics list.
    test('Topics list retrieval', function(done) {
        gazebojs.topicsList(function (e,d) {
            if(typeof d === 'string'){
                done();
            }else{
                assert.fail(1, 2, 'Topics list not retrieved', '!=');
            }
        });
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});