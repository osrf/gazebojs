var assert = require('assert'),
    util = require('util'),
    spawn = require('child_process').spawn;
    gazebojs = require('../index');


var model_uri = 'model://coke_can';
var model_mesh= 'model://coke_can/meshes/coke_can.dae';

var model_sdf = '/models/coke_can/model.sdf';
var model_config = '/models/coke_can/model.config';
var model_mesh_path = '/models/coke_can/meshes/coke_can.dae';

suite('paths', function() {

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


    test('sdf path', function(done) {
        // do not filter
        var sdfName = gazebo.sim.modelFile(model_uri );
        console.log( model_uri + ': ' + sdfName)
        assert(sdfName.search(model_sdf) != -1);
        done();
    });

    test('config', function(done) {
        // do not filter
        var options = {};
        var config = gazebo.sim.modelConfig(model_uri );
        assert(config.search("<model>") != -1);
        done();
    });

    test('asset', function(done) {
        // do not filter
        var options = {};
        var fname = gazebo.sim.findFile(model_mesh );
        assert(fname.search(model_mesh_path) != -1);
        done();
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
