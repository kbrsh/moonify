module.exports = {
  compilers: {
    pug: function(str) {
      return require("pug").compile(str, {})();
    },
    stylus: function(str) {
      return require("stylus")(str).render();
    }
  }
}
