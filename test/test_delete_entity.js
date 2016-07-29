const assert = require('assert')
const  util = require('util')
const  spawn = require('child_process').spawn
const  gazebojs = require('../index')
const  model_uri = 'model://coke_can'

suite('deletion', function() {

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

    // Test deletion of an entity.
    test('Delete an entity from using gazebo prototype', function(done) {
        gazebo.subscribe('gazebo.msgs.Response', '~/response', function(e,d){
            assert(d.response === 'success' && d.request === 'entity_delete');
            gazebo.unsubscribe('~/response');
            done();
        });
        gazebo.spawn(model_uri, 'coke_can');
        setTimeout(()=>{
            gazebo.deleteEntity('coke_can');
        },2000)
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
