var ballPos = new GL.Vector(-5, 5, 0);
var theta = 0;
var omega = 0;
var alpha = 10;
var rotate = 0;
var rotateAxis = new GL.Vector(0, 0, 1);

function toCoord(theta) {
  return new GL.Vector(-5 * Math.cos(theta * Math.PI / 180), 5 - 5 * Math.sin(theta * Math.PI / 180), 0);
}

function moveAndUpdate(seconds) {
  if (theta < 0) {
    theta = 0; 
    omega = 0; 
    alpha = 10;
  }
  if (theta > 180) {
    theta = 180; 
    omega = 0; 
    alpha = -10;
  }
  theta = theta + seconds * omega;
  omega = omega + seconds * alpha;
  alpha = 10 * Math.cos(theta * Math.PI / 180);
  ballPos = toCoord(theta);
  rotate = -2.5 * theta;
}
