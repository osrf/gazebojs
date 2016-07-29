const assert = require('assert')
const util = require('util')
const spawn = require('child_process').spawn
const gazebojs = require('../index')

var camera_uri = 'model://camera';
var sensor_uri = 'model://hokuyo';
var model_uri = 'model://cube_20k';
var kinect_uri = 'model://kinect';
var pioneer2dx_uri = 'model://pioneer2dx'; 

suite('topics', function() {

    // Topics that are not tested yet.
    // "~/link";
    // "~/physics";
    // "~/material";
    // "~/heightmap_data";
    // "~/model/modify";
    // "~/roads";
    // "~/factory/light";
    // "~/light/modify";

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

    // Test receiving Joint msgs on joint topic.
    test('joint topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Joint', '~/joint', function(e,d){
            console.log(d)
            assert(d.indexOf('pioneer2dx')!==-1);
            gazebo.unsubscribe('~/joint');
            done();
        },{'toJson': false});
        setTimeout(()=>{
            gazebo.spawn(pioneer2dx_uri, 'pioneer2dx');
        },4500)     
    });

    // Test receiving PoseStamped msgs on pose/info.
    test('pose/info topic', function(done) {
        gazebo.subscribe('gazebo.msgs.PoseStamped', '~/pose/info', function(e,d){
            console.log(d)
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
       gazebo.deleteEntity('pioneer2dx');
   });

    // Test receiving Sensor msgs on sensor topic.
    test('sensor topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Sensor', '~/sensor', function(e,d){
            console.log(d)
            assert(d.name != 'kinect');
            gazebo.unsubscribe('~/sensor');
            done();
        },{'toJson':false});
        gazebo.spawn(kinect_uri, 'kinect');
    });

    // Test receiving factory msgs on factory topic.
    test('factory topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Factory', '~/factory', function(e,d){
            assert(d.indexOf('hokuyo')!==-1);
            gazebo.unsubscribe('~/factory');
            done();
        },{'toJson':false});
        gazebo.spawn(sensor_uri, 'hokuyo');
    });

    // Test receiving Visual msgs on visual topic.
    test('visual topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Visual', '~/visual', function(e,d){
            console.log(d)
            assert(d.indexOf('hokuyo')!==-1);
            gazebo.unsubscribe('~/visual');
            done();
        },{'toJson':false});
    });

    // Test receiving Model msgs on model topic.
    test('model info topic', function(done) {
        gazebo.subscribe('gazebo.msgs.Model', '~/model/info', function(e,d){
            console.log(d)
            assert(d.name != 'cube_20k');
            gazebo.unsubscribe('~/model/info');
            done();
        },{'toJson':false});
        gazebo.spawn(model_uri, 'cube_20k');
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