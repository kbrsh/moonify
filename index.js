const Moon = require("moonjs");
const compile = require("moon-component-compiler");
const through = require("through2");
const path = require("path");
const fs = require("fs");

const util = require("./src/util.js");
let defaultConfig = require("./src/config.js");

const configPath = path.join(process.cwd(), "moonfile.js");
let config = defaultConfig;

if(fs.existsSync(configPath)) {
  util.extend(config, require(configPath));
}

const isDevelopment = config.env === "development";

module.exports = function(file) {
    const base = path.basename(file);

    if(!/\.moon$/i.test(base)) {
      return through();
    }

    const componentName = base.replace(/\.[^/.]+$/, "");
    let input = "";

    var main = function(buf, enc, next) {
      input += buf;
      next();
    }

    var flush = function(next) {
      let stream = this;
      let compiled = compile(componentName, input, {development: isDevelopment});

      const style = compiled.style;
      let code = compiled.component;

      if(isDevelopment === false && style !== undefined) {
        stream.emit('moonify-style', style);
      }

      stream.push(code);
      next();
    }

    var stream = through(main, flush);
    stream.moonify = config;

    return stream;
};
