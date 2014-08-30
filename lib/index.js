module.exports = function($vern) {
  $vern.controllers.ImagerController = require('./ImagerController');
  $vern.models.ImageModel = require('./ImageModel')($vern);
  $vern.controllers.imager = new $vern.controllers.ImagerController($vern).init();
  return $vern;
};