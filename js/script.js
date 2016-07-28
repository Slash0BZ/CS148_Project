var gl = GL.create();
var speed = 0;
var movement = 0
var mesh = GL.Mesh.sphere({ normals: true, radius: 1, detail: 12 }).computeWireframe();
var plane_mesh = GL.Mesh.plane({normals: true}).transform(GL.Matrix.scale(5, 5, 1));  
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

gl.onupdate = function(seconds) {
  movement = speed * seconds + 4.9  * seconds * seconds + movement;
  speed = seconds * 9.8 + speed;
};

gl.ondraw = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.loadIdentity();
  gl.translate(0, 4, -20);
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

  