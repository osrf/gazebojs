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

#ifndef _GZPUBSUB_HH_
#define _GZPUBSUB_HH_

#include <v8.h>
#include <uv.h>
#include <node.h>
#include <node_object_wrap.h>

#include "GazeboPubSub.hh"



namespace gzscript
{

  // inter thread communication data
  class JsCallbackData {

    public: JsCallbackData(v8::Persistent<v8::Function> &_func,
                           const std::string& _pbData);

    /// \brief The function callback
    public: v8::Persistent<v8::Function> &func;

    /// \brief This is the callback data (the topic message)
    /// in a string format (not a protobuf yet)
    public: std::string pbData;
  };


  class GazeboJsSubscriber: public GzSubscriber
  {
    public: GazeboJsSubscriber(gazebo::transport::NodePtr &_node,
                      const v8::FunctionCallbackInfo<v8::Value>& _args,
                      const char* _type,
                      const char* _topic,
                      bool _latch);

    public: virtual ~GazeboJsSubscriber();

    protected: virtual void Callback(const char* _msg);

    private:  static void doCallback(uv_async_t* handle, int status);

    private:  static void close_cb (uv_handle_t* handle);

    private: uv_async_t*  handle;

    private: v8::Persistent<v8::Function> function;
  };

  class GazeboJsPubSub : public GazeboPubSub
  {
    public: void  Subscribe(const v8::FunctionCallbackInfo<v8::Value>& args,
                            const char* type,
                            const char* topic,
                            bool latch);
  };

  class GZPubSub : public node::ObjectWrap
  {
    public: static void Init(v8::Handle<v8::Object> exports);

    private: GZPubSub();

    private: ~GZPubSub();

    private: static void New(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void Subscribe(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void Subscriptions(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void Unsubscribe(const v8::FunctionCallbackInfo<v8::Value>& args);

    /// \brief Gets the list of Materials
    private: static void Materials(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void Publish(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void Pause(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void Play(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void  Spawn(const v8::FunctionCallbackInfo<v8::Value>& args);

    /// \brief Get a model's sdf file
    private: static void ModelFile(const v8::FunctionCallbackInfo<v8::Value>& args);

    /// \brief Get a model's config file
    private: static void ModelConfig(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static void FindFile(const v8::FunctionCallbackInfo<v8::Value>& args);

    private: static v8::Persistent<v8::Function> constructor;

    private: GazeboJsPubSub* gazebo;

  };
}

#endif
