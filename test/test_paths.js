const assert = require('assert')
const util = require('util')
const spawn = require('child_process').spawn
const gazebojs = require('../index')


const model_uri = 'model://coke_can'
const model_mesh= 'model://coke_can/meshes/coke_can.dae'

const model_sdf = '/models/coke_can/model.sdf'
const model_config = '/models/coke_can/model.config'
const model_mesh_path = '/models/coke_can/meshes/coke_can.dae'

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
        var sdfName = gazebo.sim.modelFile(model_uri);
        assert(sdfName.search('coke_can') != -1,
	  'sdf file: ' + sdfName + ' is not a coke can model' )
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
