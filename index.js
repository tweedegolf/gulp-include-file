var PluginError = require('gulp-util').PluginError;
var through = require('through2');
var fs = require('fs');

module.exports = function (options) {
  options = options || {};

  var PLUGIN_NAME = 'gulp-include-file';
  var regex = options.regex || /INCLUDE_FILE\s*\(\s*['"]([^'"]*)['"]\s*\)/m;
  var transform = options.transform || JSON.stringify;

  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      this.emit(
        'error',
        new PluginError(PLUGIN_NAME, 'Cannot use streamed files')
      );
      return callback();
    }

    if (file.isBuffer()) {
      var contents = file.contents.toString(enc);
      var matches;
      while (matches = regex.exec(contents)) {
        var path = file.base + matches[1];

        if (fs.existsSync(path)) {
          var include_contents = fs.readFileSync(path, {encoding: enc});
          contents = contents.substr(0, matches.index) +
            transform(include_contents) +
            contents.substr(matches.index + matches[0].length);
        } else {
          this.emit(
            'error',
            new PluginError(PLUGIN_NAME, "File not found: " + path)
          );
          return callback();
        }
      }
      file.contents = new Buffer(contents);
    }
    callback(null, file);
  });
};
