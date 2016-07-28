function normalize(a) {
  var scale = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  a.x = a.x / scale;
  a.y = a.y / scale;
  a.z = a.z / scale;
  return a;
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}




var gl = GL.create();
var speed = 0;
var movement = 0;
var angleX = -35;
var angleY = 45;
var camera = new GL.Vector(5, 5, 5);
var mesh = GL.Mesh.sphere({ normals: true, radius: 1, detail: 12 }).computeWireframe();
var plane_mesh = GL.Mesh.plane({normals: true}).transform(GL.Matrix.scale(10, 10, 5));  
var shader = new GL.Shader('\
  varying vec3 normal;\
  void main() {\
    normal = gl_Normal;\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
  }\
', '\
  uniform float brightness;\
  varying vec3 normal;\
  void main() {\
    gl_FragColor = vec4(brightness * (normal * 0.5 + 0.5), 1.0);\
  }\
');

gl.onmousemove = function(e) {
  if (e.dragging) {
    angleY -= e.deltaX * 0.25;
    angleX = Math.max(-90, Math.min(90, angleX - e.deltaY * 0.25));
  }
};

gl.onupdate = function(seconds) {
  //movement = speed * seconds + 4.9  * seconds * seconds + movement;
  //speed = seconds * 9.8 + speed;
  
  var CameraSpeed = seconds * 4;

  // Forward movement
  var up = GL.keys.W | GL.keys.UP;
  var down = GL.keys.S | GL.keys.DOWN;
  var forward = GL.Vector.fromAngles((90 - angleY) * Math.PI / 180, (180 - angleX) * Math.PI / 180);
  camera = camera.add(forward.multiply(CameraSpeed * (up - down)));

  // Sideways movement
  var left = GL.keys.A | GL.keys.LEFT;
  var right = GL.keys.D | GL.keys.RIGHT;
  var sideways = GL.Vector.fromAngles(-angleY * Math.PI / 180, 0);
  camera = camera.add(sideways.multiply(CameraSpeed * (right - left)));
};

gl.ondraw = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.loadIdentity();
  gl.translate(0, 0, 0);
  gl.rotate(-angleX, 1, 0, 0);
  gl.rotate(-angleY, 0, 1, 0);
  gl.translate(-camera.x, -camera.y, -camera.z);
  gl.pushMatrix();
  gl.translate(0, -movement, 0);
  shader.uniforms({ brightness: 1 }).draw(mesh, gl.TRIANGLES);
  shader.uniforms({ brightness: 0 }).draw(mesh, gl.LINES);
  gl.popMatrix();
  gl.rotate(-90, 1, 0, 0);
  gl.translate(0, 0, -10);
  shader.uniforms({ brightness: 1 }).draw(plane_mesh, gl.TRIANGLES);
};

gl.fullscreen();
gl.animate();
gl.enable(gl.CULL_FACE);
gl.enable(gl.POLYGON_OFFSET_FILL);
gl.polygonOffset(1, 1);
gl.clearColor(0.8, 0.8, 0.8, 1);
gl.enable(gl.DEPTH_TEST);



  
