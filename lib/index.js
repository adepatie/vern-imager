module.exports = function($vern) {
  $vern.controllers.ImagerController = require('./ImagerController');
  $vern.models.ImageModel = require('./ImageModel')($vern);
  return $vern;
};