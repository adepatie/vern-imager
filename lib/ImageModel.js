var validator = require('validator');

module.exports = function Model(scope) {
  function ImageModel() {
    this._owner = true;
    this.url = null;
    this.original_url = null;
    this.name = null;
    this.type = null;
    this.size = null;
    this.effect = null;

    return this.update(arguments[0]);
  }

  new scope.model().extend(ImageModel, {
    collection: 'imager_images',
    exclude: [],
    indexes: ['url', 'original_url']
  });

  return ImageModel;
};