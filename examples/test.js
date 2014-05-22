var vern = require('vern-core');


new vern().then(function($vern) {
  $vern = require('vern-authentication')($vern);
  $vern = require('vern-authentication-jsapi')($vern);
  $vern = require('vern-aws')($vern);
  $vern = require('../lib')($vern);

  $vern.controllers.auth = new $vern.controllers.AuthController($vern).init();
  $vern.controllers.auth.firstRun();
  $vern.controllers.aws = new $vern.controllers.AWSController($vern).init();
  $vern.controllers.imager = new $vern.controllers.ImagerController($vern).init();



}).fail(function(err) {
    console.log(err);
    console.log(err.stack);
  });