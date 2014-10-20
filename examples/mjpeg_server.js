//
// This example requires the 'mjpeg-server' npm module
// to install: npm install mjpeg-server
//
var http = require('http');
var url = require('url');
var fs = require('fs');
var mjpegServer = require('mjpeg-server');
var util = require('util');
var gazebojs = require('gazebojs');

if (process.argv.length < 3)
{
  console.log( 'node ' + process.argv[1] + ' [port]');
  process.exit(-1);
}

var port = parseInt(process.argv[2]);
var gazebo = new gazebojs.Gazebo();


http.createServer(function(req, res) {
    var url_parts = url.parse(req.url, true);
    console.log("Got request: " + util.inspect(url_parts));
    var camera = url_parts.path;
    var skip = 2;
    if(url_parts.query['skip'])
        skip = parseInt(url_parts.query['skip']); 
    var topic = '~' + camera + '/link/camera/image';
    console.log('topic' + topic);
    console.log('port ' + port);

    mjpegReqHandler = mjpegServer.createReqHandler(req, res);

    var i = skip;
    gazebo.subscribeToImageTopic(topic, function (err, img){
        i -=1;
        if (i < 0 ){ 
            i = skip;
            mjpegReqHandler.update(img);
            console.log(topic);
        }
    });

    req.on("close", function() {
        console.log('request closed! unsubscribing');
        gazebo.unsubscribe(topic);
        mjpegReqHandler.close();
    });

    req.on("end", function() {
      console.log('request ended!');
      // gazebo.unsubscribe(topic);
      // mjpegReqHandler.close();
    });


}).listen(port);


console.log('setup a loop with 5000 sec interval tick');
setInterval(function (){
  console.log('tick ' + gazebo);
},50000000);


