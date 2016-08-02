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
/*
var shader_phong = new GL.Shader('\
  varying vec4 forFragColor;\
  const vec3 lightPos = vec3(0.0, 5.0, 0.0);\
  const vec3 diffuseColor = vec3(0.5, 0.0, 0.0);\
  const vec3 specColor = vec3(1.0, 1.0, 1.0);\
  void main(){\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
    vec3 normal = gl_Normal;\
    vec4 vertPos4 = modelview * vec4(inputPosition, 1.0);\
    vec3 vertPos = vec3(vertPos4) / vertPos4.w;\
    vec3 lightDir = normalize(lightPos - vertPos);\
    vec3 reflectDir = reflect(-lightDir, normal);\
    vec3 viewDir = normalize(-vertPos);\
    float lambertian = max(dot(lightDir,normal), 0.0);\
    float specular = 0.0;\
    if(lambertian > 0.0) {\
      float specAngle = max(dot(reflectDir, viewDir), 0.0);\
      specular = pow(specAngle, 4.0);\
    }\
    forFragColor = vec4(lambertian*diffuseColor + specular*specColor, 1.0);\
}\
', '\
  precision mediump float; \
  varying vec4 forFragColor;\
  void main() {\
  gl_FragColor = forFragColor;\
  }\
');

var shader_phong2 = new GL.Shader('\
  #version 330 core\
  layout (location = 0) in vec3 position;\
  layout (location = 1) in vec3 normal;\
  out vec3 Normal;\
  out vec3 FragPos;\
  uniform mat4 model;\
  uniform mat4 view;\
  uniform mat4 projection;\
  void main()\
  {\
    gl_Position = projection * view * model * vec4(position, 1.0);\
    FragPos = position;\
    Normal = normal;\
  }\
','\
  #version 330 core\
  in vec3 FragPos;\
  in vec3 Normal;    
  uniform vec3 lightPos; 
  uniform vec3 viewPos;
  uniform vec3 lightColor;
  uniform vec3 objectColor;
  void main()
  {
    vec3 lightVec = normalize(lightPos - FragPos);
    vec3 viewVec = normalize(viewPos - FragPos);
    vec3 reflectVec = reflect(-lightVec, normalize(Normal));
    float spec = pow(max(dot(viewVec, reflectVec), 0), 32);
    vec3 specVec = 0.5 * spec * lightColor;
    float diff = max(dot(normalize(Normal), lightVec), 0);
    vec3 diffVec = diff * lightColor;
    vec3 ambVec = 0.1 * lightColor;
    color = vec4(((diffVec + specVec + ambVec) * objectColor), 1);
  } 
');
*/
gl.onupdate = function(seconds) {
  movement = speed * seconds + 4.9  * seconds * seconds + movement;
  speed = seconds * 9.8 + speed;
};

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

  while (t < 3.2){
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
  gl.loadIdentity();
  gl.translate(0, 0, -20);
  //gl.translate(-5, -12, 0);
  shader2.uniforms({brightness: 1}).draw(railMesh, gl.TRIANGLES);
  gl.popMatrix();
}
//drawRail();

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

  