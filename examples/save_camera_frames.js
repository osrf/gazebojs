var util = require('util');
var gazebojs = require('.');
// var gazebojs = require('gazebojs');
var fs = require('fs');


// adds 0 in front a string for padding
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

if (process.argv.length != 6)
{
  console.log('node save_camera_frames.js [source camera name] [dest_path] [format] [count]')
  console.log('  ex: node save_camera_frames.js camera out jpeg 5')
  process.exit(-1);
}

var gazebo = new gazebojs.Gazebo()
var src_camera = process.argv[2]
var dest_path = process.argv[3]
var format = process.argv[4]
var framesToSave = parseInt(process.argv[5]);


var src_topic  = '~/' + src_camera + '/link/camera/image';

var savedFrames = 0;

console.log('saving [' + src_topic + '] to  [' + dest_path + '] for ' + framesToSave + ' frames as ' + format);


options = {format:format}
gazebo.subscribeToImageTopic(src_topic, function (err, img){
  if(err) {
      throw err
  }
  var fname = dest_path + '_' + pad(savedFrames ++, 4) + '.' + options.format ;

  if (savedFrames <=  framesToSave)
  fs.writeFile(fname, img, function (err) {
      if(err)
          throw err;
      console.log(fname + ' saved');
  });
}, options);



console.log('setup a loop with 5 sec interval tick');
setInterval(function (){
  console.log('tick ' + gazebo);
},5000);



