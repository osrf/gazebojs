const assert = require('assert')
const spawn = require('child_process').spawn
const gazebojs = require('../index')
const timing = require('./timing.js').fast

const model_uri = 'model://coke_can'
const model_mesh= 'model://coke_can/meshes/coke_can.dae'
const model_mesh_path = '/models/coke_can/meshes/coke_can.dae'


suite('paths', function() {

    var gzserver;
    var gazebo;

    this.timeout(timing.test);

    suiteSetup (function(done){

        gzserver = spawn('gzserver', ['--verbose']);
        gzserver.on('data', (data) => { console.log('gz: ' + data) })
        // allow time for gzserver to come up
        setTimeout(()=> {
            gazebo = new gazebojs.Gazebo();
            gazebo.proc = gzserver
            console.log('sim pid: ' + gazebo.proc.pid)
            done();
        }, timing.spawn);
    });


    test('sdf path', function(done) {
        // do not filter
        var sdfName = gazebo.sim.modelFile(model_uri);
        assert(sdfName.search('coke_can') != -1,
            'sdf file: ' + sdfName + ' is not a coke can model' )
        done();
    });

    test('config', function(done) {
        // do not filter
        // var options = {};
        var config = gazebo.sim.modelConfig(model_uri );
        assert(config.search("<model>") != -1);
        done();
    });

    test('asset', function(done) {
        // do not filter
        // var options = {};
        var fname = gazebo.sim.findFile(model_mesh );
        assert(fname.search(model_mesh_path) != -1);
        done();
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
