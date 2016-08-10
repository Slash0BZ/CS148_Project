var s = 0;
var ballContactPos = points[0];
var spe = tangents[0].unit().multiply(10);
var accR = new GL.Vector(0, 0, 0);
var accT = new GL.Vector(0, 0, 0);
var grav = new GL.Vector(0, -10, 0);
var norm = getProperties(0)["normal"];
var tang = getProperties(0)["tangent"];
var rad = getProperties(0)["radius"];
var rotate = 0;
var rotateAxis = tang.cross(norm);
var ballPos = points[0].add(norm);


function inverseS(prevS, newPos) {
  var oldPos = getPosition(prevS).subtract(newPos).length();
  for (var i = 0.01; i < 1; i += 0.01) {
    var nowPos = getPosition(prevS + i);
    if (nowPos > oldPos) {
      return prevS + i;
    }
    oldPos = nowPos;
  }
  return -1;
}



function toCoord(theta) {
  var vec = new GL.Vector(-4 * Math.cos(theta * Math.PI / 180), 4 - 4 * Math.sin(theta * Math.PI / 180), 0);
  return vec;
}

function moveAndUpdate(seconds) {
  if (rad == -1) {
    rotate += spe.length() * seconds;
    ballContactPos = ballContactPos.add(spe.multiply(seconds));
    s = inverseS(s, ballContactPos);
    ballContactPos = getPosition(s);
    spe = spe.add(acc.multiply(seconds));
    accR = norm.multiply(spe.dot(spe) / rad);
    accT = tang.unit().multiply(tang.unit().dot(grav));
    norm = getProperties(s)["normal"];
    tang = getProperties(s)["tangent"];
    rad = getProperties(s)["radius"];
    ballPos = ballContactPos.add(norm);
    console.log("sss");
    console.log(ballPos);
    console.log(norm);
  }
}
