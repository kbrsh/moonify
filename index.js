var through = require("through2");
var jsdom = require("jsdom");
var path = require("path");
var fs = require("fs");
var Moon = require("moonjs");
var defaultConfig = require("./src/config.js");
var util = require("./src/util.js");
var generateId = require("./src/id.js");
var addClass = require("./src/addClass.js");
var scopeStyle = require("./src/scopeStyle.js");

module.exports = function(file) {
    var base = path.basename(file);

    if(!/\.moon$/i.test(base)) {
      return through();
    }

    var input = "";
    var code = "";
    var componentName = base.replace(/\.[^/.]+$/, "");
    var id = generateId(componentName);
    var scopeClass = `m-scope-${id}`;
    var configPath = path.join(process.cwd(), "moonfile.js");
    var config = defaultConfig;

    // There is a config file
    if(fs.existsSync(configPath)) {
      util.extend(config, require(configPath));
    }

    var main = function(buf, enc, next) {
      input += buf;
      next();
    }

    var flush = function(next) {
      var stream = this;
      code += `var componentName = "${componentName}"; var scopeId = "${scopeClass}";\nvar __moon__options__ = {};\n`;

      jsdom.env(input, function(err, window) {
        var template = window.document.querySelector("template");
        var script = window.document.querySelector("script");
        var style = window.document.querySelector("style");
        var isProduction = config.env !== "development";
        var scoped = null;

        // Compile style tag
        if(style) {
          var lang = style.getAttribute("lang");
          scoped = style.getAttribute("scoped") !== null;

          if(lang) {
            style.innerHTML = config.compilers[lang](style.innerHTML);
          }

          style.innerHTML = style.innerHTML.replace(/\n/g, "");

          if(scoped) {
            style.innerHTML = scopeStyle(style.innerHTML, scopeClass);
          }

          if(isProduction) {
            stream.emit('moonify-style', style.innerHTML);
          } else {
            code += `var insert = require('moonify/src/insert');\nvar removeStyle = insert(scopeId, ${JSON.stringify(style.innerHTML)});\n`;
          }
        }

        // Compile options
        if(script) {
          var lang = script.getAttribute("lang");
          if(lang) {
            script.innerHTML = config.compilers[lang](script.innerHTML);
          }
          code += `__moon__options__ = (function(exports) {${script.innerHTML} return exports;})({});`;
        }

        // Compile a template
        if(template) {
          var lang = template.getAttribute("lang");
          if(lang) {
            template.innerHTML = config.compilers[lang](template.innerHTML);
          }

          if(style && scoped) {
            addClass(template.content.childNodes, scopeClass);
          }

          var render = Moon.compile(`<div>${template.innerHTML}</div>`).toString();
          render.replace(/^function (anonymous)/, function(match, name) {
            render = render.replace(name, "");
          });
          code += `__moon__options__.render = ${render};\n`;
        }

        // Export the component
        code += `module.exports = function(Moon) {return Moon.component(componentName, __moon__options__);}`;

        // Minify all code, if in production
        if(isProduction) {
          code = require("uglify-js").minify(code, {fromString: true}).code;
        }

        stream.push(code);
        next();
      });
    }

    var stream = through(main, flush);
    stream.moonify = config;

    return stream;
};
