var gazebojs = require('gazebojs');

if (process.argv.length != 5)
{
  console.log('node subscribe.js [msg type] [topic name] [number of messages]');
  console.log('ex:\nnode subscribe.js "gazebo.msgs.WorldStatistics" "~/world_stats" 10\n');
  process.exit(-1);
}

var type  = process.argv[2];
var topic = process.argv[3];
var count = parseInt(process.argv[4]);

var gazebo= new gazebojs.Gazebo();
console.log("subscribing to topic [" + topic + "] of type [" + type + "]");


// subscribe to the topic with a callback function
gazebo.subscribe(type, topic, function (err, msg){
  
    try {
      if (err) throw(err);
      console.log('-- [' + count + '] --');
      count += -1;
      // convert the Json msg to a string
      var s= JSON.stringify(msg);
      console.log(s);

    } catch(err)  {
      console.log('error: ' + err);
      console.log(msg);
    }
  }
);

console.log('keep the process alive...');
setInterval(function (){
    if(count <= 0)
    {
       gazebo.unsubscribe(topic);
       process.exit(0);
    }
},100);

