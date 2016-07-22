const assert = require('assert')
const  util = require('util')
const  spawn = require('child_process').spawn
const  gazebojs = require('../index')
const exec = require('child_process').exec

suite('adverise a topic test', function() {

    var gzserver;
    var gazebo;
    var name = 'hello/world';
    var topic_name = '~/' + name;
    var msg_type = 'Factory';
    
    var msg = {pause:true};

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

    // test to check if the topic was advertised correctly.
    test('test adverise', function(done) {
        gazebo.sim.advertise(msg_type, topic_name);
        const child = exec('gz topic --l' , (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            if(stdout.indexOf(name)!==-1){
                    done();
            }else{
                    assert.fail(1, 2, 'topic not found' + topic_name , '>');
            }
        });
    });

    suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
    });

});