const assert = require('assert')
const spawn = require('child_process').spawn
const gazebojs = require('../index')
const timing = require('./timing.js').del

const sensor_uri = 'model://hokuyo'
const model_uri = 'model://cube_20k'
const pioneer2dx_uri = 'model://pioneer2dx'

suite('topics', function() {

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

    // Test receiving Joint msgs on joint topic.
    test('joint topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Joint', '~/joint', function(e,d){
            assert(d.indexOf('pioneer2dx')!==-1);
            gazebo.unsubscribe('~/joint');
            done();
        },{'toJson': false});
        gazebo.sim.advertise('gazebo.msgs.Factory','~/factory') 
        setTimeout(()=>{
            gazebo.spawn(pioneer2dx_uri, 'pioneer2dx');
        },timing.cmd)   
    });

    // Test receiving PoseStamped msgs on pose/info.
    test('pose/info topic', function(done) {
        gazebo.subscribe('gazebo.msgs.PoseStamped', '~/pose/info', function(e,d){
            assert(d.indexOf('pioneer2dx')!==-1);
            gazebo.unsubscribe('~/pose/info');
            done();
        },{'toJson': false});
    });

    // Test response and request topics.
    test('request and response topics test', function(done) {
        gazebo.subscribe('gazebo.msgs.Response', '~/response', function(e,d){
            assert(d.response === 'success' && d.request === 'entity_delete');
            gazebo.unsubscribe('~/response');
            done();
        });
        setTimeout(()=>{
            gazebo.deleteEntity('pioneer2dx');
        },timing.cmd)  
    });

    // Test receiving factory msgs on factory topic.
    test('factory topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Factory', '~/factory', function(e,d){
            assert(d.indexOf('hokuyo')!==-1);
            gazebo.unsubscribe('~/factory');
            done();
        },{'toJson':false});
        setTimeout(()=>{
            gazebo.spawn(sensor_uri, 'hokuyo');
        },timing.cmd) 
    });

    // Test receiving Visual msgs on visual topic.
    test('visual topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Visual', '~/visual', function(e,d){
            assert(d.indexOf('hokuyo')!==-1);
            gazebo.unsubscribe('~/visual');
            done();
        },{'toJson':false});
        setTimeout(()=>{
            gazebo.spawn(sensor_uri, 'hokuyo');
        },timing.cmd) 
    });


    // Test receiving Sensor msgs on sensor topic.
    test('sensor topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Sensor', '~/sensor', function(e,d){
            assert(d.indexOf('laser')!==-1);
            gazebo.unsubscribe('~/sensor');
            done();
        },{'toJson':false}); 
    });

    // Test receiving Model msgs on model topic.
    test('model info topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Model', '~/model/info', function(e,d){
            assert(d.indexOf('cube_20k')!==-1);
            gazebo.unsubscribe('~/model/info');
            done();
        },{'toJson':false});
        setTimeout(()=>{
            gazebo.spawn(model_uri, 'cube_20k');
        },timing.cmd) 
    });

    // Test receiving WorldControl msgs on joint world_control topic.
    test('world/control topic', function(done) {
        gazebo.subscribe('gazebo.msgs.WorldControl', '~/world_control', function(e,d){
            assert(d.pause);
            gazebo.unsubscribe('~/world_control');
            gazebo.publish("gazebo.msgs.WorldControl",  "~/world_control", {pause:false});
            done();
        });
        gazebo.publish("gazebo.msgs.WorldControl",  "~/world_control", {pause:true});
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});
