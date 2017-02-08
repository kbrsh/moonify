module.exports = function(str) {
  str = str.split('').map(function(s){
      return s.charCodeAt(0);
    });
  str = str.reduce(function(prev, curr){
    return ((prev << 5) + prev) + curr;
  }, 5381);
  return str.toString(36);
}
