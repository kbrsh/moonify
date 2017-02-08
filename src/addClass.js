module.exports = function(nodes, name) {
  for(var i = 0; i < nodes.length; i++) {
    if(nodes[i].classList) {
      nodes[i].classList.add(name);
      module.exports(nodes[i].childNodes, name);
    }
  }
}
