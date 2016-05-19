/*
 * Copyright 2013 Open Source Robotics Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

#include <iostream>
#include <node.h>

#include <v8.h>
#include <uv.h>

///////////////
#include <list>
#include <map>
#include <gazebo/msgs/msgs.hh>
#include <gazebo/common/CommonIface.hh>
#include <gazebo/common/ModelDatabase.hh>
///////////////

#include "GZPubSub.hh"
#include "GazeboPubSub.hh"


using namespace v8;
using namespace gzscript;
using namespace std;

v8::Persistent<v8::Function> GZPubSub::constructor;

/////////////////////////////////////////////////
void InitAll(Handle<Object> exports)
{
  GZPubSub::Init(exports);
}

/////////////////////////////////////////////////
GZPubSub::GZPubSub()
{
  this->gazebo = new GazeboJsPubSub();
};

/////////////////////////////////////////////////
GZPubSub::~GZPubSub()
{
  // Make sure to shut everything down.
  gazebo::transport::fini();
};

/////////////////////////////////////////////////
void GZPubSub::Init(Handle<Object> exports)
{
  Isolate* isolate = exports->GetIsolate();

  // Prepare constructor template
  Local<FunctionTemplate> tp1 = FunctionTemplate::New(isolate, New);
  tp1->SetClassName(String::NewFromUtf8(isolate, "Sim"));
  tp1->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tp1, "unsubscribe", Unsubscribe);
  NODE_SET_PROTOTYPE_METHOD(tp1, "subscribe", Subscribe);
  NODE_SET_PROTOTYPE_METHOD(tp1, "subscriptions", Subscriptions);
  NODE_SET_PROTOTYPE_METHOD(tp1, "publish", Publish);
  NODE_SET_PROTOTYPE_METHOD(tp1, "materials", Materials);
  NODE_SET_PROTOTYPE_METHOD(tp1, "pause", Pause);
  NODE_SET_PROTOTYPE_METHOD(tp1, "play", Play);
  NODE_SET_PROTOTYPE_METHOD(tp1, "spawn", Spawn);
  NODE_SET_PROTOTYPE_METHOD(tp1, "modelFile", ModelFile);
  NODE_SET_PROTOTYPE_METHOD(tp1, "modelConfig", ModelConfig);
  NODE_SET_PROTOTYPE_METHOD(tp1, "findFile", FindFile);

  // export the template
  constructor.Reset(isolate, tp1->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "Sim"), tp1->GetFunction());
}

/////////////////////////////////////////////////
void GZPubSub::New(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());
  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    // double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    GZPubSub* obj = new GZPubSub();
    obj->Wrap(args.Holder());
    args.GetReturnValue().Set(args.Holder());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(args.GetIsolate(), constructor);
    args.GetReturnValue().Set(cons->NewInstance(argc, argv));
  }
}

//////////////////////////////////////////////////
void GZPubSub::Pause(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
  obj->gazebo->Pause();

  args.GetReturnValue().SetUndefined();
}


/////////////////////////////////////////////////
void GZPubSub::Play(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
  obj->gazebo->Play();
  args.GetReturnValue().SetUndefined();
}

/////////////////////////////////////////////////
void GZPubSub::ModelFile(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  if ( args.Length() != 1 )
  {
    args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
	"Wrong number of arguments. 1 expected"));
    return;
  }

  if (!args[0]->IsString())
  {
     args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
	"Wrong argument type. Uri String model name expected."));
    return;
  }

  String::Utf8Value sarg0(args[0]->ToString());
  std::string uri(*sarg0);
  std::string model = gazebo::common::ModelDatabase::Instance()->GetModelFile(uri);
  v8::Handle<v8::String> returnStr = v8::String::NewFromUtf8(
    args.GetIsolate(), model.c_str());
  args.GetReturnValue().Set(returnStr);
}

/////////////////////////////////////////////////
void GZPubSub::ModelConfig(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  if ( args.Length() != 1 )
  {
    args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong number of arguments. 1 expected"));
    return;
  }

  if (!args[0]->IsString())
  {
     args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong argument type. Uri String model name expected."));
    return;
  }
  String::Utf8Value sarg0(args[0]->ToString());
  std::string uri(*sarg0);
  std::string config = gazebo::common::ModelDatabase::Instance()->GetModelConfig(uri);
  v8::Handle<v8::String> returnStr = v8::String::NewFromUtf8(args.GetIsolate(), config.c_str());
  args.GetReturnValue().Set(returnStr);
}

/////////////////////////////////////////////////
void GZPubSub::FindFile(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  if ( args.Length() != 1 )
  {
    args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong number of arguments. 1 expected"));
    return;
  }

  if (!args[0]->IsString())
  {
     args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong argument type. Uri String model name expected."));
    return;
  }
  String::Utf8Value sarg0(args[0]->ToString());
  std::string uri(*sarg0);
  std::string r = gazebo::common::find_file(uri);
  v8::Handle<v8::String> returnStr = v8::String::NewFromUtf8(args.GetIsolate(), r.c_str());
  args.GetReturnValue().Set(returnStr);
}


/////////////////////////////////////////////////
void GZPubSub::Spawn(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  // we expect one string argument
  if ( (args.Length() < 2)  || (args.Length() > 8)  )
  {
     args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong number of arguments. 1 expected"));
    return;
  }

  if (!args[0]->IsString())
  {
    args.GetIsolate()->ThrowException(
       v8::String::NewFromUtf8(args.GetIsolate(),
       "Wrong argument type. Type string expected as first argument."));
    return;
  }

  if (!args[1]->IsString())
  {
    args.GetIsolate()->ThrowException(
       v8::String::NewFromUtf8(args.GetIsolate(),
       "Wrong argument type. Name string expected as first argument."));
    return;
  }

  double pose[6];
  for(unsigned int i = 0; i < 6; ++i)
  {
    // verify that arguments 3 to 8 are numbers or undefined
    pose[i] = 0;
    unsigned int argIndex = i +2;
    if ((unsigned int)args.Length() > argIndex)
    {
      if (!args[argIndex]->IsNumber())
      {
        std::string msg = "Wrong argument type. Number expected for argument ";
	msg += std::to_string(argIndex + 1);
	msg += ".";
        args.GetIsolate()->ThrowException(
          v8::String::NewFromUtf8(args.GetIsolate(), msg.c_str()));
        return;
      }
      pose[i] = args[argIndex]->ToNumber()->NumberValue();
    }
  }

  String::Utf8Value sarg0(args[0]->ToString());
  std::string type(*sarg0);
  String::Utf8Value sarg1(args[1]->ToString());
  std::string name(*sarg1);
  GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());

  obj->gazebo->SpawnModel(type.c_str(),
			  name.c_str(),
                          pose[0],
                          pose[1],
                          pose[2],
                          pose[3],
                          pose[4],
                          pose[5]);
  args.GetReturnValue().SetUndefined();
}


/////////////////////////////////////////////////
void GZPubSub::Materials(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
  // this function is not asynchronous, but it could (should?) be.
  std::vector<std::string> msgs = obj->gazebo->GetMaterials();
  Local<Array> result_list = Array::New(args.GetIsolate());
  for (unsigned int i = 0; i < msgs.size(); ++i) {
    result_list->Set(i, String::NewFromUtf8(args.GetIsolate(), msgs[i].c_str()));
  }
  args.GetReturnValue().Set(result_list);
}

/////////////////////////////////////////////////
void GZPubSub::Subscriptions(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
  std::vector<std::string> v = obj->gazebo->Subscriptions();
  Local<Array> result_list = Array::New(args.GetIsolate());
  for (unsigned int i = 0; i < v.size(); ++i) {
    result_list->Set(i, String::NewFromUtf8(args.GetIsolate(), v[i].c_str()));
  }
  args.GetReturnValue().Set(result_list);
}


/////////////////////////////////////////////////
void GZPubSub::Subscribe(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  if ( (args.Length() < 3)  || (args.Length() > 4)  )
  {
     args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong number of arguments."));
     return;
  }

  if (!args[0]->IsString())
  {
     args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong argument type. Type String expected as first argument."));
     return;
  }

  if (!args[1]->IsString())
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong argument type. Topic String expected as second argument."));
    return;
  }

  if (!args[2]->IsFunction())
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong argument type. Function  expected as third argument."));
    return;
  }

  bool latch = false;
  if(args.Length() > 3 )
  {
    if (!args[3]->IsBoolean())
    {
      args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(),
        "Wrong argument type. Latch Boolean expected as third arument."));
      return;
    }
    latch = *args[3]->ToBoolean();
  }
  // extract msg type, topic and callback from javascript
  String::Utf8Value sarg0(args[0]->ToString());
  std::string type(*sarg0);
  String::Utf8Value sarg1(args[1]->ToString());
  std::string topic(*sarg1);
  try
  {
    GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
    obj->gazebo->Subscribe(args, type.c_str(), topic.c_str(), latch);
  }
  catch(PubSubException &x)
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      x.what()));
    return;
  }
  args.GetReturnValue().SetUndefined();
}


/////////////////////////////////////////////////
void GZPubSub::Unsubscribe(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  // we expect one string argument
  if (args.Length() < 1)
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong number of arguments"));
    return;
  }

  if (!args[0]->IsString())
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong argument type. String expected."));
    return;
  }

  String::Utf8Value sarg(args[0]->ToString());
  std::string topic(*sarg);

  GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
  obj->gazebo->Unsubscribe(topic.c_str());

  args.GetReturnValue().SetUndefined();
}

/////////////////////////////////////////////////
void GZPubSub::Publish(const FunctionCallbackInfo<Value>& args)
{
  HandleScope scope(args.GetIsolate());

  // we expect one string argument
  if ( (args.Length() != 3)  )
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong number of arguments. 3 expected"));
    return;
  }

  if (!args[0]->IsString())
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong argument type. Type String expected as first argument."));
    return;
  }

  if (!args[1]->IsString())
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong argument type. Topic String expected as second argument."));
    return;
  }

  if (!args[2]->IsString())
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      "Wrong argument type. Message String expected as third argument."));
    return;
  }

  String::Utf8Value sarg0(args[0]->ToString());
  std::string type(*sarg0);

  String::Utf8Value sarg1(args[1]->ToString());
  std::string topic(*sarg1);

  String::Utf8Value sarg2(args[2]->ToString());
  std::string msg(*sarg2);

  try
  {
    GZPubSub* obj = ObjectWrap::Unwrap<GZPubSub>(args.Holder());
    obj->gazebo->Publish(type.c_str(), topic.c_str(), msg.c_str());
  }
  catch(PubSubException &x)
  {
    args.GetIsolate()->ThrowException(
      v8::String::NewFromUtf8(args.GetIsolate(),
      x.what() ));
    return;
  }
  args.GetReturnValue().SetUndefined();
}

/////////////////////////////////////////////////
void GazeboJsPubSub::Subscribe(const FunctionCallbackInfo<Value>& _args,
                               const char* _type,
                               const char* _topic,
                               bool _latch)
{
  Subscriber *sub = new GazeboJsSubscriber(this->node, _args, _type, _topic, _latch);
  this->AddSubscriber(sub);
}

/////////////////////////////////////////////////
GazeboJsSubscriber::GazeboJsSubscriber(gazebo::transport::NodePtr &_node,
                                       const FunctionCallbackInfo<Value>& args,
                                       const char* _type,
                                       const char* _topic,
                                       bool _latch)
  :GzSubscriber(_node, _type, _topic, _latch)
{
  Isolate *isolate = args.GetIsolate();
  Local<Function> local = Local<Function>::Cast(args[2].As<v8::Function>());
  this->function.Reset(isolate, local);

  // setup the inter thread notification handle (from the main script engine thread)
  this->handle = (uv_async_t*)malloc(sizeof(uv_async_t));
  uv_async_cb cb = (uv_async_cb)GazeboJsSubscriber::doCallback;
  uv_async_init(uv_default_loop(), this->handle, cb);

}


/////////////////////////////////////////////////
GazeboJsSubscriber::~GazeboJsSubscriber()
{
  // tear down the inter thread communication
  uv_close((uv_handle_t*)this->handle, close_cb);
}


/////////////////////////////////////////////////
void GazeboJsSubscriber::close_cb(uv_handle_t* _handle)
{
  free(_handle);
}


/////////////////////////////////////////////////
void GazeboJsSubscriber::doCallback(uv_async_t* _handle, int _status)
{
  Isolate * isolate = Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  const unsigned argc = 2;
  JsCallbackData* p = (JsCallbackData*)_handle->data;

  v8::Handle<v8::Value> argv[argc] = {
    v8::Null(isolate),
    v8::String::NewFromUtf8(isolate, p->pbData.c_str())
  };

  v8::TryCatch try_catch;

  v8::Local<v8::Function> localCallback = v8::Local<v8::Function>::New(isolate, p->func);
  localCallback->Call(isolate->GetCurrentContext()->Global(), argc, argv);
  delete p;

  if (try_catch.HasCaught()) {
    node::FatalException(isolate, try_catch);
  }
}


JsCallbackData::JsCallbackData(v8::Persistent<v8::Function> &_func,
                           const std::string& _pbData)
 :func(_func), pbData(_pbData)
{
}

/////////////////////////////////////////////////
// this is called from the callback thread, and
// not a javascript thread
void  GazeboJsSubscriber::Callback(const char *_msg)
{
  JsCallbackData* p = new JsCallbackData(this->function, _msg);
  p->pbData = _msg;
  this->handle->data = (void *)p;
  // this should signal the script thread that the work is done
  uv_async_send(handle);
}

/////////////////////////////////////////////////
NODE_MODULE(gazebo, InitAll)
