/**
 * Authorization and registration functions for Facebook
 *
 * @class FacebookController
 * @constructor
 */
module.exports = function ImagerController($parent) {
  var validator = require('validator');

  var $scope = new $parent.controller(ImagerController);
  $scope.model = $parent.models.ImageModel;

  /**
   *
   * Handles all image manipulation requests
   *
   * @method handleImager
   * @param req
   * @param req.params
   * @param req.params.url The URL required to be parsed, upon success, is forwarded. Upon error, the same url is returned.
   * @param res
   * @param next
   * @returns {*}
   */
  $scope.handleImager = function(req, res, next) {
    var user = req.user;

    if(!req.params.url) {
      return res.resp.handleError(404, 'Missing URL');
    }

    var conditions = {
      original_url: req.params.url,
      _owner: user._id.toString()
    };

    var image_conditions = parseParams(conditions, req.params);

    new $parent.models.ImageModel().query(conditions, function(err, images) {
      if(err) {
        return res.resp.handleError(500, 'An error occurred getting the image');
      }
      if(!images.length) {
        // apply image_conditions and then save new url.

      } else {
        res.header('Location', images[0].url);
        res.send(302);
      }
    });
  };

  function parseParams(conditions, params) {
    var image_conditions = {};
    if(params.size) {
      image_conditions.size = conditions.size = size;
    }

    return image_conditions;
  }

  $scope.addRoute({
    path: '/imager',
    controller: $scope.handleImager,
    requiresAuth: true
  });

  $scope.addRoute({
    path: '/jsapi/imager',
    controller: $scope.handleImager,
    requiresSession: true
  });

  return $scope;

};
