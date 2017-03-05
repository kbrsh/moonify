var fs = require('fs');
var path = require('path');

module.exports = function (b, opts) {
  var styles = {};
  var css = "";

  b.on('bundle', function(bs) {
    bs.on('end', function() {
      fs.writeFileSync(path.join(process.cwd(), "build.css"), css);
    });
  });

  b.on('transform', function(tr) {
    if(tr.moonify) {
      tr.on('moonify-style', function(style) {
        css += style;
      });
    }
  });
}
