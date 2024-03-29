/**
 * Authorization and registration functions for Facebook
 *
 * @class FacebookController
 * @constructor
 */
module.exports = function ImagerController($parent) {
  var validator = require('validator');
  var gm        = require('gm');
  var http      = require('http');
  var https     = require('https');
  var url       = require('url');
  var fs        = require('fs');
  var path      = require('path');
  var mime      = require('mime');
  var os        = require('os');
  var util      = require('util');
  var tmp       = (os.tmpdir || os.tmpDir)();

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
    var user = req.user || req.account;

    if(!req.params.url) {
      return res.resp.handleError(404, 'Missing URL');
    }
    if(!validator.isURL(req.params.url)) {
      return res.resp.handleError(400, 'Invalid URL');
    }

    var conditions = {
      original_url: req.params.url,
      _owner: user._id.toString()
    };

    if(req.params.size) {
      conditions.size = req.params.size;
    }

    if(req.params.effect) {
      conditions.effect = req.params.effect;
    }

    var image_conditions = Object.create(conditions);
    image_conditions.user = user;

    if(req.group) {
      conditions = {
        $or: [{_groups: req.group._id.toString()}, {_owner: user._id.toString()}],
        original_url: req.params.url
      };
      if(req.params.size) {
        conditions.size = req.params.size;
      }

      if(req.params.effect) {
        conditions.effect = req.params.effect;
      }
      image_conditions.group = req.group;
    }

    new $parent.models.ImageModel().query(conditions, function(err, images) {
      if(err) {
        return res.resp.handleError(500, 'An error occurred getting the image');
      }
      if(!images.length) {
        // apply image_conditions and then save new url.
        image_conditions.quality = req.params.quality || 80;
        $scope.generateImage(image_conditions, function(err, image) {
          if(err) {
            return res.resp.handleError(500, err);
          }
          res.header('Location', image.url);
          res.send(302);
        });
      } else {
        if(req.params.force) {
          image_conditions.quality = req.params.quality || 80;
          $scope.generateImage(image_conditions, function(err, image) {
            if(err) {
              return res.resp.handleError(500, err);
            }
            res.header('Location', image.url);
            res.send(302);
          }, images[0]);
        } else {
          res.header('Location', images[0].url);
          res.send(302);
        }
      }
    });
  };

  $scope.generateImage = function(conditions, callback, image) {
    var urlOpts = url.parse(conditions.original_url);
    var filePaths = urlOpts.pathname.split('/');
    if(image) {
      conditions.fileName = image.name;
    } else {
      conditions.fileName = 'imager-' + uid() + '-' + filePaths[filePaths.length - 1];
    }
    var tmpFile = conditions.tmpFile = path.join(tmp, conditions.fileName);
    httpAgent = conditions.original_url.indexOf('https') > -1 ? https : http;
    httpAgent.get(urlOpts, function(res) {
      conditions.writeStream = res.pipe(fs.createWriteStream(tmpFile));
      var received = 0;

      res.on('data', function(chunk) {
        received += chunk.length;
      });

      res.once('error', function(err) {
        conditions.writeStream.destroy();
        return callback(new Error('Image could not be downloaded'));
      });

      res.once('end', function() {
        renderImage(conditions, callback, image);
      });
    });
  };

  function renderImage(conditions, callback, prevImage) {
    var size = conditions.size.split(',');
    var width = null, height = null, options = null;

    var image = gm(conditions.tmpFile);
    image.quality(conditions.quality);
    if(size) {
      width = parseInt(size[0], 10);
      height = parseInt(size[1], 10);
      options = size[2];
      image.resize(width, height, options);
    }

    image.write(conditions.tmpFile, function(err) {
      if(err) {
        fs.unlink(conditions.tmpFile, function(){});
        return callback(err, null);
      }

      var aws = new $parent.controllers.AWSController($parent);
      aws.getUserBucket(conditions.user, function(err, user) {
        if(err) {
          fs.unlink(conditions.tmpFile, function(){});
          return callback(err, null);
        }
        var params = {
          bucket: $parent.localConfig.AWS_prefix + '/' + user.s3Bucket,
          fileName: conditions.fileName,
          filePath: conditions.tmpFile,
          type: mime.lookup(conditions.tmpFile)
        };
        aws.bucketSendFile(params, function(err, file) {
          if(err) {
            fs.unlink(conditions.tmpFile, function(){});
            return callback(err, null);
          }

          if(!prevImage) {
            var imager = new $parent.models.ImageModel(image);
            imager.url = '//s3.amazonaws.com/' + params.bucket + '/' + encodeURIComponent(params.fileName);
            imager.original_url = conditions.original_url;
            imager.name = conditions.fileName;
            imager.size = conditions.size;
            imager.effect = conditions.effect;
            imager.addOwner(conditions.user).addGroup(conditions.group).save(function (err, imager) {
              fs.unlink(conditions.tmpFile, function () {
              });
              return callback(null, imager);
            });
          } else {
            callback(null, prevImage);
          }
        });
      });
    });
  }

  function uid() {
    return Math.random().toString(36).slice(2);
  }

  $scope.addRoute({
    path: '/imager',
    controller: $scope.handleImager,
    requiresAuth: true
  });

  $scope.addRoute({
    path: '/jsapi/imager',
    controller: $scope.handleImager,
    requiresAccessToken: true
  });

  return $scope;

};
