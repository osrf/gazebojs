var assert = require('assert'),
    util = require('util'),
    spawn = require('child_process').spawn;
    gazebojs = require('../index');

suite('filter test using gzserver', function() {

    var gzserver;
    var gazebo;
    var timeout_period = 1000;
    var first = true;

    this.timeout(5000);

    suiteSetup (function(done){
        // console.log('suiteSetup');
        gzserver = spawn('gzserver', [ __dirname + '/../examples/pendulum_cam.world']);
        gzserver.on('data', (data) => { console.log('gz: ' + data) })
        // give a second for gzserver to come up
        setTimeout(()=> {
            gazebo = new gazebojs.Gazebo();
            gazebo.proc = gzserver
            console.log('sim pid: ' + gazebo.proc.pid)
            done();
        }, 100);
    });

    // default filter: not filtered.
    test('No filter', function(done) {
        const filter = new gazebojs.PosesFilter({})
        var poses = 0
        var poses0 = 0
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e, poseMsg){
            const filtered = filter.addPosesStamped(poseMsg)
            // the total number of messages
            poses += poseMsg.pose.length
            // messages passing through filter 0
            poses0 += filtered.length
            if (poses > 100) {
              // the test is done.
              gazebo.unsubscribe('~/pose/info')
              assert.equal(poses, filter.msgCount)
              // no filtereing with default params
              assert( poses == poses0) 
              done()
            }
         })
    });

    test('Heavy filter', function(done) {
        // heavy filtering
        const filter = new gazebojs.PosesFilter({timeElapsed : 1.0,
                                                  distance: 0.01,
                                                  quaternion: 0.01})
        var poses = 0
        var poses1 = 0
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e, poseMsg){
            const filtered =  filter.addPosesStamped(poseMsg)
            // the total number of messages
            poses += poseMsg.pose.length
            // messages passing through filter 1
            poses1 += filtered.length
            if (poses > 100) {
              // the test is done.
              gazebo.unsubscribe('~/pose/info')
              assert.equal(poses, filter.msgCount)
              // some messages were filtered
              assert( poses1 < poses)   
              done()
            }
         })
    });

    // no msgs should pass throught.
    test('all msgs are filtered', function(done) {
        var filter = new gazebojs.PosesFilter({timeElapsed : 1.0, distance: 10, quaternion: 10 } );
        var poses = 0
        var poses1 = 0
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,poseMsg){
            const filtered =  filter.addPosesStamped(poseMsg)
            // the total number of messages
            poses += poseMsg.pose.length
            // messages passing through filter 1
            poses1 += filtered.length
            if (poses > 100) {
              // the test is done.
              gazebo.unsubscribe('~/pose/info')
              assert.equal(poses, filter.msgCount)
              // We always recives the first msg, which for the double pendlum contains 6 poses.
              assert.equal(poses1, 6)
              done()
            }
         })
    });

    // distance filter.
    test('distance filter', function(done) {
        var filter = new gazebojs.PosesFilter({timeElapsed : 1.0, distance: 0.01, quaternion: 10 } );
        var poses = 0
        var poses1 = 0
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,poseMsg){
            const filtered =  filter.addPosesStamped(poseMsg)
            // the total number of messages
            poses += poseMsg.pose.length
            // messages passing through filter 1
            poses1 += filtered.length
            if (poses > 100) {
              // the test is done.
              gazebo.unsubscribe('~/pose/info')
              assert.equal(poses, filter.msgCount)
              // some messages were filtered
              assert( poses1 < poses)   
              done()
            }
         })
    });

    // Rotation filter.
    test('Rotation filter', function(done) {
        var filter = new gazebojs.PosesFilter({timeElapsed : 1000, distance: 1000, quaternion: 0.01 } );
        var poses = 0
        var poses1 = 0
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,poseMsg){
            const filtered =  filter.addPosesStamped(poseMsg)
            // the total number of messages
            poses += poseMsg.pose.length
            // messages passing through filter 1
            poses1 += filtered.length
            if (poses > 100) {
              // the test is done.
              gazebo.unsubscribe('~/pose/info')
              assert.equal(poses, filter.msgCount)
              // some messages were filtered
              assert( poses1 < poses)   
              done()
            }
         })
    });

    // time too short, no messages were filtered.
    test('time too short, no messages were filtered', function(done) {
        var filter = new gazebojs.PosesFilter({timeElapsed : 1.0e-6 } );
        var poses = 0
        var poses1 = 0
        gazebo.subscribe('gazebo.msgs.PosesStamped', '~/pose/info', function(e,poseMsg){
            const filtered =  filter.addPosesStamped(poseMsg)
            // the total number of messages
            poses += poseMsg.pose.length
            // messages passing through filter 1
            poses1 += filtered.length
            if (poses > 100) {
              // the test is done.
              gazebo.unsubscribe('~/pose/info')
              assert.equal(poses, filter.msgCount)
              // no messages were filtered
              assert.equal(poses1, poses);   
              done()
            }
         })
    });

      suiteTeardown(function() {
        console.log('suiteTeardown');
        gzserver.kill('SIGHUP');
      });

});