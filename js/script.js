var gl = GL.create();
var speed = 0;
var movement = 0;
var sphere_radius = 1;
//var mesh = GL.Mesh.sphere({ normals: true, radius: 1, detail: 12 }).computeWireframe();  
var mesh = GL.Mesh.sphere({ normals: true, radius: 1, detail: 12 });  
var plane_mesh = GL.Mesh.plane({normals: true}).transform(GL.Matrix.scale(0.1, 0.5, 1));
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

gl.onupdate = function(seconds) {
  movement = speed * seconds + 4.9  * seconds * seconds + movement;
  speed = seconds * 9.8 + speed;
};

function fxyz(t){
  var ret = [];
  ret[0] = t;
  ret[1] = (t - 5) * (t - 5);
  ret[2] = 0;
  return ret;
}
function fnormal(t){
  var ret = [];
  var k = -1 / 2 * (t - 5);
  if (k > 0){
    ret[0] = 1;
    ret[1] = -1 / 2 * (t - 5);
    ret[2] = 0;
  }
  else if (k == 0){
    ret[0] = 0;
    ret[1] = 1;
    ret[2] = 0
  }
  else{
    ret[0] = -1;
    ret[1] = k;
    ret[2] = 0;
  }
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

  while (t < 10){
    var current = fxyz(t);
    var c_normal = fnormal(t);
    var unit = (sphere_radius / 2) / Math.sqrt(c_normal[0] * c_normal[0] +
                                               c_normal[1] * c_normal[1] + 
                                               c_normal[2] * c_normal[2]);
    var x = current[0] - unit * c_normal[0];
    var y = current[1] - unit * c_normal[1];
    var z = current[2] - unit * c_normal[2]; 
    vertices[verticesCount] = [x, y, z - 1];
    vertices[verticesCount + 1] = [x, y, z + 1];
    verticesCount = verticesCount + 2;
    t = t + 0.1;
  }
  for(var i = 0; i < vertices.length - 2; i++){
    if (i % 2 == 0){
      triangles[trianglesCount] = [i, i+1, i+2];
      trianglesCount++;
    }
    else{
      triangles[trianglesCount] = [i, i+2, i+1];
      trianglesCount++;
    }
  }


  var data = {
   vertices: vertices,
   triangles: triangles
  };
  var nmesh = GL.Mesh.load(data);
  railMesh = nmesh;
  console.log(1);
  return nmesh;

}
loadRailMesh();
function drawRail(){
  gl.pushMatrix();
  gl.loadIdentity();
  gl.translate(0, 5, -20);
  gl.translate(-5, -12, 0);
  shader2.uniforms({brightness: 1}).draw(railMesh, gl.TRIANGLES);
  gl.popMatrix();
}
drawRail();

gl.ondraw = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.loadIdentity();
  gl.translate(0, 5, -20);
  gl.pushMatrix();
  gl.translate(0, -movement, 0);
  gl.scale(0.2, 0.2, 0.2);
  shader.uniforms({ brightness: 1 }).draw(mesh, gl.TRIANGLES);
  //shader.uniforms({ brightness: 0 }).draw(mesh, gl.LINES);
  gl.popMatrix();
  //gl.rotate(-90, 1, 0, 0);
  //gl.translate(0, 0, -10);
  //shader.uniforms({ brightness: 1 }).draw(plane_mesh, gl.TRIANGLES);
  //gl.scale(10,10,10);
  drawRail();

};

gl.fullscreen();
gl.animate();
gl.enable(gl.CULL_FACE);
gl.enable(gl.POLYGON_OFFSET_FILL);
gl.polygonOffset(1, 1);
gl.clearColor(0.8, 0.8, 0.8, 1);
gl.enable(gl.DEPTH_TEST);

  