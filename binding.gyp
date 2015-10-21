{
  "targets": [
    {
      "target_name": "gazebo",
      "sources": [
        "GZPubSub.cc", "GZPubSub.hh",
        "PubSub.cc", "PubSub.hh",
        "GazeboPubSub.cc", "GazeboPubSub.hh",
        "json2pb.c", "jsonp2b.h",
        "ConfigLoader.cc", "ConfigLoader.hh",
        "OgreMaterialParser.cc", "OgreMaterialParser.hh"],
      'cflags_cc!': [ '-fno-rtti', '-fno-exceptions' ],
      'cflags!': [ '-fno-exceptions' ],
      "conditions": [
        ['OS=="linux"', {
          'cflags': [
            '<!@(pkg-config --cflags gazebo jansson protobuf)',
            '-std=c++11'
          ],
          'ldflags': [
            '<!@(pkg-config --libs-only-L --libs-only-other gazebo jansson protobuf)'
          ],
          'libraries': [
            '<!@(pkg-config --libs-only-l gazebo jansson protobuf)'
          ]
        }],
        ['OS=="mac"', {
          'libraries': [
            '<!@(pkg-config --libs-only-l gazebo jansson protobuf)'
          ],
          'xcode_settings' : {
            'MACOSX_DEPLOYMENT_TARGET': '10.7',
            'GCC_ENABLE_CPP_RTTI': 'YES',
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'OTHER_CFLAGS': [
              '<!@(pkg-config --cflags gazebo jansson protobuf)'
            ],
            'OTHER_CPLUSPLUSFLAGS': [
              '-std=c++11',
              '-stdlib=libc++',
              '<!@(pkg-config --cflags gazebo jansson protobuf)'
            ],
            'OTHER_LDFLAGS': [
              '-stdlib=libc++',
              '<!@(pkg-config --libs-only-L --libs-only-other  gazebo jansson protobuf)'
            ]
          }
        }]
      ]
    }
  ]
}
