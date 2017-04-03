module.exports = function(css, scopeClass) {
  var compiled = css;
  css.replace(/(\S)+(?=[\s]*{)/g, function(match) {
     compiled = compiled.replace(match, `${match}.${scopeClass}`);
  });
  return compiled;
}
