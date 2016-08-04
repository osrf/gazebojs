const assert = require('assert')
const util = require('util')
const spawn = require('child_process').spawn
const gazebojs = require('../index')


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
            if((typeof d === 'object') && (d.length > 0) && (typeof(d[0]) === 'string')){
                done();
            }else{
                assert.fail(1, 2, 'Topics list not retrieved', '!=');
            }
        });
    });

    // Test Gzsrver not running.
    test('Topics list gz server not running', function(done) {
        gzserver.kill('SIGHUP');
        gazebojs.topicsList(function (e,d) {
            if(d.indexOf('instance')!==-1){
                done();
            }else if(e){
                assert.fail(1, 2, 'Topicslist with no gzserver doesnt return error', '!=');
            }
        });
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
    });

});
