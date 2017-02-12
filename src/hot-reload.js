var Moon;
window.__MOON_HOT_RELOAD_MAP__ = {};

module.exports.install = function(moon) {
  Moon = moon;
}

module.exports.reload = function(name, opts) {
  var instances = __MOON_HOT_RELOAD_MAP__[name];
  var newCtor = Moon.component(name, opts);
  for(var i = 0; i < instances.length; i++) {
    var instance = instances[i];
    var newInstace = new newCtor();
    Moon.util.extend(instance, newInstace);
    instance.build();
  }
}
