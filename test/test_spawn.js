var assert = require('assert'),
    util = require('util'),
    spawn = require('child_process').spawn;
    gazebojs = require('../index');

    var model_uri = 'model://cube_20k';

suite('spawn', function() {

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

    // Spawning a model
    test('spawn a model', function(done) {
        gazebo.subscribe('gazebo.msgs.Model', '~/model/info', function(e,d){
            assert(d.name != 'cube');
            gazebo.unsubscribe('~/model/info');
            done();
        });
        setTimeout(()=>{
            gazebo.spawn(model_uri, 'cube');
        },2000);
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
