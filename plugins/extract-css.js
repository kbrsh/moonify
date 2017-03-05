var fs = require('fs');
var path = require('path');

module.exports = function (b, opts) {
  var styles = {};
  var output = "build.css";
  var css = "";

  b.on('bundle', function(bs) {
    bs.on('end', function() {
      fs.writeFileSync(path.join(process.cwd(), output), css);
    });
  });

  b.on('transform', function(tr) {
    if(tr.moonify) {
      output = tr.moonify.extractCSS;
      tr.on('moonify-style', function(style) {
        css += style;
      });
    }
  });
}
