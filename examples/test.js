var vern = require('vern-core');


new vern().then(function($vern) {
  $vern = require('vern-authentication')($vern);
  $vern = require('../lib')($vern);

}).fail(function(err) {
    console.log(err);
    console.log(err.stack);
  });