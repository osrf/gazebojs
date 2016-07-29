const assert = require('assert')
const  util = require('util')
const  spawn = require('child_process').spawn
const  gazebojs = require('../index')

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
            gazebo.unsubscribe('~/model/info');
            assert(d.name === 'cube');
            done();
        });
        gazebo.sim.advertise('gazebo.msgs.Factory','~/factory')
        setTimeout(()=>{
            gazebo.spawn('box', 'cube');
        },2000);
    });

    // Spawning a model
    test('spawn a model with 5 arguments', function(done) {
        gazebo.subscribe('gazebo.msgs.Model', '~/model/info', function(e,d){
            gazebo.unsubscribe('~/model/info');
            assert(d.name === 'cube1');
            done();
        });
        gazebo.sim.advertise('gazebo.msgs.Factory','~/factory')
        setTimeout(()=>{
            gazebo.spawn('box', 'cube1', 1, 1, 1);
        },2000);
    });

    // Spawning a model
    test('spawn a model with 8 arguments', function(done) {
        gazebo.subscribe('gazebo.msgs.Model', '~/model/info', function(e,d){
            gazebo.unsubscribe('~/model/info');
            assert(d.name === 'cube2');
            done();
        });
        gazebo.sim.advertise('gazebo.msgs.Factory','~/factory')
        setTimeout(()=>{
            gazebo.spawn('box', 'cube2', 1, 0, 0, 0.1, 0.1, 1);
        },2000);
    });

    suiteTeardown(function() {
        console.log('unsubscribingTopics');
        gazebo.unsubscribe('~/model/info');
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
