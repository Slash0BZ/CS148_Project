// variables
var gl = GL.create();
var angleX = -23.5;
var angleY = -2;
var camera = new GL.Vector(1.166,6.23,20);
var sphere_radius = 1;
var mesh = GL.Mesh.sphere({ normals: true, radius: sphere_radius, detail: 12 }).computeWireframe();
var plane_mesh = GL.Mesh.plane({normals: true}).transform(GL.Matrix.scale(10, 10, 5));

//shaders
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

var shader2 = new GL.Shader('\
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

//draw rails
function fxyz(t){
  var ret = [];
  ret[0] = 5 * Math.cos(t);
  ret[1] = -5 * Math.sin(t);
  ret[2] = 0;
  return ret;
}
function fnormal(t){
  var ret = [];
  ret[0] = -5 * Math.cos(t);
  ret[1] = 5 * Math.sin(t);
  ret[2] = 0;
  return ret;
}
var railMesh;
function loadRailMesh(){
  //gl.pushMatrix();
  var t = 0;
  var vertices = [];
  var verticesCount = 0;
  var triangles = [];
  var trianglesCount = 0;

  while (t < Math.PI){
    var current = fxyz(t);
    console.log(current[0] + " " + current[1]);
    var c_normal = fnormal(t);
    //var unit = (sphere_radius) / Math.sqrt(c_normal[0] * c_normal[0] +
      //                                         c_normal[1] * c_normal[1] + 
       //                                        c_normal[2] * c_normal[2]);
    var x = current[0];
    var y = current[1];
    var z = current[2];
    /*var x = current[0] - unit * c_normal[0];
    var y = current[1] - unit * c_normal[1];
    var z = current[2] - unit * c_normal[2]; */

    vertices[verticesCount] = [x, y, z - 1];
    vertices[verticesCount + 1] = [x, y, z + 1];
    verticesCount = verticesCount + 2;
    t = t + 0.05;
  }
  for(var i = 0; i < vertices.length - 2; i++){
    if (i % 2 == 0){
      triangles[trianglesCount] = [i, i+2, i+1];
      trianglesCount++;
    }
    else{
      triangles[trianglesCount] = [i, i+1, i+2];
      trianglesCount++;
    }
  }


  var data = {
   vertices: vertices,
   triangles: triangles
  };
  var nmesh = GL.Mesh.load(data);
  railMesh = nmesh;
  return nmesh;

}
loadRailMesh();
function drawRail(){
  gl.pushMatrix();
  //gl.loadIdentity();
  gl.translate(0, 4, 0);
  //gl.translate(-5, -12, 0);
  shader2.uniforms({brightness: 1}).draw(railMesh, gl.TRIANGLES);
  gl.popMatrix();
}

// mouse events
gl.onmousemove = function(e) {
  if (e.dragging) {
    angleY -= e.deltaX * 0.25;
    angleX = Math.max(-90, Math.min(90, angleX - e.deltaY * 0.25));
  }
};

// animation
gl.onupdate = function(seconds) {
  moveAndUpdate(seconds);
  
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

// scene renderer
gl.ondraw = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.loadIdentity();
  // camera
  gl.rotate(-angleX, 1, 0, 0);
  gl.rotate(-angleY, 0, 1, 0);
  gl.translate(-camera.x, -camera.y, -camera.z);
  // ball
  gl.pushMatrix();
  gl.translate(ballPos.x, ballPos.y, ballPos.z);
  gl.rotate(rotate, rotateAxis.x, rotateAxis.y, rotateAxis.z);
  shader.uniforms({ brightness: 1 }).draw(mesh, gl.TRIANGLES);
  shader.uniforms({ brightness: 0 }).draw(mesh, gl.LINES);
  gl.popMatrix();
  // plane
  drawRail();
  gl.rotate(-90, 1, 0, 0);
  gl.translate(0, 0, -10);
  shader.uniforms({ brightness: 1 }).draw(plane_mesh, gl.TRIANGLES);
  // rail
};


gl.fullscreen();
gl.animate();
gl.enable(gl.CULL_FACE);
gl.enable(gl.POLYGON_OFFSET_FILL);
gl.polygonOffset(1, 1);
gl.clearColor(0.8, 0.8, 0.8, 1);
gl.enable(gl.DEPTH_TEST);
