var path = require("path");
var fs = require("fs");
module.exports = {
  compilers: {
    pug: function(str) {
      return require("pug").compile(str, {})();
    },
    stylus: function(str) {
      return require("stylus")(str).render();
    },
    babel: function(str) {
      var babel = require("babel-core");
      var babelConfigPath = path.join(process.cwd(), '.babelrc');
      var babelOptions = fs.existsSync(babelConfigPath) ? json.parse(fs.readFileSync(babelConfigPath, 'utf-8')) : {
        presets: ['es2015-nostrict']
      }
      return babel.transform(str, babelOptions).code;
    }
  }
}
