var assert = require('assert'),
    gazebojs = require('../index')

var p0 = {"time":{"sec":2439,"nsec":572000000},"pose":[{"name":"unit_box_1","position":{"x":-1.167557578249068,"y":-2.0295644863191242,"z":0.4999884898091361},"id":9,"orientation":{"x":7.320207237922252e-9,"y":2.737929260847979e-7,"z":0.002237386423635488,"w":0.9999974970478259}},{"name":"unit_box_1::link","position":{"x":0,"y":0,"z":0},"id":10,"orientation":{"x":0,"y":0,"z":0,"w":1}},{"name":"camera","position":{"x":-0.9394431681062324,"y":-2.0253987539294283,"z":1.0000420441896463},"id":15,"orientation":{"x":0.000017672787827230705,"y":0.0002680908524925834,"z":-0.06043297309684322,"w":0.9981722214015193}},{"name":"camera::link","position":{"x":0.05,"y":0.05,"z":0.05},"id":16,"orientation":{"x":0,"y":0,"z":0,"w":1}},{"name":"double_pendulum_with_base","position":{"x":2.400944665626656,"y":-2.5931253164373196,"z":-0.000009450688551541902},"id":28,"orientation":{"x":-4.1577126759277024e-7,"y":-0.000003211012295096265,"z":-0.0011796150005405715,"w":0.9999993042487416}},{"name":"double_pendulum_with_base::base","position":{"x":0,"y":0,"z":0},"id":29,"orientation":{"x":0,"y":0,"z":0,"w":1}},{"name":"double_pendulum_with_base::upper_link","position":{"x":1.1538427855472552e-7,"y":0.000003559286982480842,"z":2.09999121243617},"id":38,"orientation":{"x":-0.9793774995540574,"y":1.1090157965793287e-8,"z":3.6064138461385314e-8,"w":0.20203889072958464}},{"name":"double_pendulum_with_base::lower_link","position":{"x":0.2500000736440263,"y":0.39575550940920246,"z":1.1816234509856252},"id":51,"orientation":{"x":-0.4809843984657993,"y":3.742152185641415e-8,"z":2.3000511891997994e-8,"w":0.8767291534062793}}]}


var p1 = {"time":{"sec":2439,"nsec":759000000},"pose":[{"name":"camera","position":{"x":-0.9394562528584841,"y":-2.025399611171051,"z":1.0000478811643658},"id":15,"orientation":{"x":0.000016516299932868475,"y":0.0002851805780335155,"z":-0.06043389244630635,"w":0.9981721610238576}},{"name":"camera::link","position":{"x":0.05,"y":0.05,"z":0.05},"id":16,"orientation":{"x":0,"y":0,"z":0,"w":1}},{"name":"double_pendulum_with_base","position":{"x":2.4009444962361783,"y":-2.5931251186246316,"z":-2.387290788260335e-7},"id":28,"orientation":{"x":-1.4999037463561534e-7,"y":7.684872359471244e-7,"z":-0.001176083703062174,"w":0.9999993084130161}},{"name":"double_pendulum_with_base::base","position":{"x":0,"y":0,"z":0},"id":29,"orientation":{"x":0,"y":0,"z":0,"w":1}},{"name":"double_pendulum_with_base::upper_link","position":{"x":1.9542798090147202e-8,"y":0.000004135143816605919,"z":2.099996319395077},"id":38,"orientation":{"x":-0.9082237540221416,"y":-5.832778664574547e-9,"z":8.36155166590233e-9,"w":0.418484901316557}},{"name":"double_pendulum_with_base::lower_link","position":{"x":0.24999999968733733,"y":0.7601693210347232,"z":1.450255741078733},"id":51,"orientation":{"x":-0.5659066212119802,"y":-3.7611249607393687e-10,"z":9.343693177033334e-9,"w":0.8244693421034165}}]}


suite('filter', function() {

    test('default filter: not filtered', function() {
        // do not filter
        var options = {};
        var filter = new gazebojs.PosesFilter(options);
        // add p0 messages
        var unfiltered0 = filter.addPosesStamped(p0);
        assert.equal(unfiltered0.length, p0.pose.length);
        // add p1 messages
        var unfiltered1 = filter.addPosesStamped(p1);
        assert.equal(unfiltered1.length, p1.pose.length);
    });
 
    test('all msgs are filtered', function(){
        var filter = new gazebojs.PosesFilter({timeElapsed : 1.0, distance: 10, quaternion: 10 } );
        // add p0 messages
        var unfiltered0 = filter.addPosesStamped(p0);
        assert.equal(unfiltered0.length, p0.pose.length);
        // add p1 messages
        var unfiltered1 = filter.addPosesStamped(p1);
        assert.equal(unfiltered1.length, 0);
    });

    test('distance filter', function(){
        var filter = new gazebojs.PosesFilter({timeElapsed : 1.0, distance: 0.01, quaternion: 10 } );
         // add p0 messages
        var unfiltered0 = filter.addPosesStamped(p0);
        assert.equal(unfiltered0.length, p0.pose.length);
        // add p1 messages
        var unfiltered1 = filter.addPosesStamped(p1);
        // some objects moved... 
        assert.notEqual(unfiltered1.length, 0);
        assert.notEqual(unfiltered1.length, p1.pose.length);
    });


    test('rotation filter', function(){
        var filter = new gazebojs.PosesFilter({timeElapsed : 1000, distance: 1000, quaternion: 0.01 } );
         // add p0 messages
        var unfiltered0 = filter.addPosesStamped(p0);
        assert.equal(unfiltered0.length, p0.pose.length);
        // add p1 messages
        var unfiltered1 = filter.addPosesStamped(p1);
        // some objects rotated.. 
        assert.notEqual(unfiltered1.length, 0);
        assert.notEqual(unfiltered1.length, p1.pose.length);
    });


   test('time too short, no messages pass through', function(){
        var filter = new gazebojs.PosesFilter({timeElapsed : 1.0e-6 } );
        // add p0 messages
        var unfiltered0 = filter.addPosesStamped(p0);
        assert.equal(unfiltered0.length, p0.pose.length);
        // add p1 messages
        var unfiltered1 = filter.addPosesStamped(p1);
        assert.equal(unfiltered1.length, p1.pose.length);
    });

});
