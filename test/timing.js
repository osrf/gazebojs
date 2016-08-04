'use strict'

// small module for timeout values accross tests.
// most tests use the 'fast' times, but each test
// can have its own timeouts


exports.fast = {
  test  : 5000,  // timeout for test
  spawn : 1500,  // timeout when launching gzserver
  cmd   : 200    // timeout before sending a command
}

exports.del = {
  test: 5000,
  spawn: 2000,
  cmd: 2000
}

exports.perf = {
  spawn: 1500,
  test: 5000,
  test_period: 4000  // the duration of the performance test
}

exports.move = {
  test: 5000,
  spawn: 1500
}

exports.spawn = {
  test: 5000,
  spawn: 1500,
  cmd: 2000
}

