module.exports = function(css, scopeClass) {
  var compiled = "";
  css.replace(/(\S)+(?=[\s]*{)/g, function(match) {
     compiled = css.replace(match, `${match}.${scopeClass}`);
  });
  return compiled;
}
