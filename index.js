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
      code += `var Moon; var componentName = "${componentName}"; var scopeId = "${scopeClass}";\nvar __moon__options__ = {};\n`;

      jsdom.env(input, function(err, window) {
        var template = window.document.querySelector("template");
        var script = window.document.querySelector("script");
        var style = window.document.querySelector("style");
        var isProduction = config.env !== "development";
        var scoped = null;

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

          code += `var insert = require('moonify/src/insert');\nvar removeStyle = insert(scopeId, ${JSON.stringify(style.innerHTML)});\n`;
        }

        if(script) {
          var lang = script.getAttribute("lang");
          if(lang) {
            script.innerHTML = config.compilers[lang](script.innerHTML);
          }
          if(isProduction) {
            script.innerHTML = require("uglify-js").minify(script.innerHTML, {fromString: true}).code;
          }
          code += `__moon__options__ = (function(exports) {${script.innerHTML} return exports;})({});`;
        }

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

        if(!isProduction) {
          code += `var hotReload = require("moonify/src/hot-reload");
          if(module.hot) {
            module.hot.accept();
            if(module.hot.data) {
              hotReload.install(require("moonjs"));
              hotReload.reload(componentName, __moon__options__);
            }
            module.hot.dispose(removeStyle);
          };
          function Component() {
            var componentCtor = Moon.component(componentName, __moon__options__);
            var componentInstance = new componentCtor();
            if(!window.__MOON_HOT_RELOAD_MAP__[componentName]) {
              window.__MOON_HOT_RELOAD_MAP__[componentName] = [componentInstance];
            } else {
              window.__MOON_HOT_RELOAD_MAP__[componentName].push(componentInstance);
            }
            return componentInstance;
          };
          module.exports = function(moon) {Moon = moon; return Component;}`;
        } else {
          code += `module.exports = function(moon) {Moon = moon; return Moon.component(componentName, __moon__options__);}`;
        }

        stream.push(code);
        next();
      });
    }

    return through(main, flush);
};
