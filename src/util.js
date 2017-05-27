module.exports.extend = function(obj1, obj2) {
  for(var prop in obj2) {
    if(typeof obj2[prop] === "object") {
      obj1[prop] = module.exports.extend(obj1[prop], obj2[prop]);
    } else {
      obj1[prop] = obj2[prop];
    }
  }
  return obj1;
}
