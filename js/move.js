var s = 0.1;
var ballContactPos = points[0];
var initH = ballContactPos.y;
var spe = tangents[0].unit().multiply(10);
var accR = new GL.Vector(0, 0, 0);
var accT = new GL.Vector(0, 0, 0);
var grav = new GL.Vector(0, -5, 0);
var norm = getProperties(0)["normal"].negative();
var tang = getProperties(0)["tangent"];
var rad = getProperties(0)["radius"];
var rotate = 0;
var rotateAxis = norm.cross(tang);
var ballPos = points[0].add(norm);
var engy = ballContactPos.y * 10;
//var ballPos = new GL.Vector(0, -1, 0);
var sgn = 1;

function inverseS(prevS, newPos) {
  var oldPos = getPosition(prevS);
  var len = getPosition(prevS).subtract(newPos).length();
  for (var i = 0.01; i < 1; i += 0.01) {
    var nowPos = getPosition(prevS + i * sgn);
    if ((nowPos.subtract(oldPos)).length() - len > 0) {
      return prevS + i * sgn;
    }
  }
  return -1;
}

function toCoord(theta) {
  var vec = new GL.Vector(-4 * Math.cos(theta * Math.PI / 180), 4 - 4 * Math.sin(theta * Math.PI / 180), 0);
  return vec;
}

var oldS = s;
console.log(points.length - 1);
function moveAndUpdate(seconds) {
  oldS = s;
  accT = tang.unit().multiply(tang.unit().dot(grav));
  if (spe.add(accT.multiply(seconds)).dot(tang) < 0 && Math.abs(initH - ballContactPos.y) < 0.01) {
    sgn = -sgn;
    tang = tang.negative();
  }
  //spe = tang.unit().multiply(spe.add(accT.multiply(seconds)).length());
  spe = tang.unit().multiply(Math.sqrt(engy - ballContactPos.y * 10));
  ballContactPos = ballContactPos.add(spe.multiply(seconds));
  s = inverseS(s, ballContactPos);

  if (s <= 0 || s >= points.length - 1) {
    s = oldS;
    bump();
    return;
  }

  ballContactPos = getPosition(s);
  rotate += spe.length() * seconds * 180 / Math.PI;
  rotateAxis = norm.cross(tang);

  norm = getProperties(s)["normal"].negative();
  tang = getProperties(s)["tangent"].multiply(sgn);
  rad = getProperties(s)["radius"];
  ballPos = ballContactPos.add(norm);
}

function bump() {
  sgn = -sgn;
  spe = spe.negative();
}
