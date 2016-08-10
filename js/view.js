// variables
var gl = GL.create();
var angleX = -23.5;
var angleY = -2;
var camera = new GL.Vector(1.166,6.23,20);
var sphere_radius = 1;
var mesh = GL.Mesh.sphere({ normals: true, radius: sphere_radius, detail: 12 }).computeWireframe();
var plane_mesh = GL.Mesh.plane({normals: true, coords: true}).transform(GL.Matrix.scale(150, 150, 1));
var server_prefix = "http://localhost/public/rollerball/";
var fs_prefix = "texture/1/";
var skybox_front;
var skybox_back;
var skybox_left;
var skybox_right;
var skybox_up;
var skybox_down;

function loadSkyBoxMesh(){
  skybox_front = GL.Texture.fromURL(server_prefix + fs_prefix + "front.png");
  skybox_back = GL.Texture.fromURL(server_prefix + fs_prefix + "back.png");
  skybox_left = GL.Texture.fromURL(server_prefix + fs_prefix + "left.png");
  skybox_right = GL.Texture.fromURL(server_prefix + fs_prefix + "right.png");
  skybox_up = GL.Texture.fromURL(server_prefix + fs_prefix + "up.png");
  skybox_down = GL.Texture.fromURL(server_prefix + fs_prefix + "down.png");
}

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

var shader_skybox = new GL.Shader('\
  varying vec2 coord;\
  void main() {\
    coord = gl_TexCoord.xy;\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
  }\
', '\
  uniform sampler2D texture;\
  varying vec2 coord;\
  void main() {\
    gl_FragColor = texture2D(texture, coord);\
  }\
');

var shader_phong = new GL.Shader('\
  varying vec3 normal;\
  varying vec3 FragPos;\
  void main() {\
    normal = gl_NormalMatrix * gl_Normal;\
    vec4 FragPosPre = gl_ModelViewMatrix * gl_Vertex;\
    FragPos = (gl_ModelViewMatrix * gl_Vertex).xyz;\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
  }\
  ','\
  varying vec3 normal;\
  varying vec3 FragPos;\
  uniform vec3 lightPos;\
  uniform vec3 viewPos;\
  const vec3 lightColor = vec3(1.0, 1.0, 1.0);\
  const vec3 objectColor = vec3(1.0, 0.0, 0.0);\
  void main() {\
    vec3 lightVec = normalize(lightPos - FragPos);\
    vec3 viewVec = normalize(viewPos - FragPos);\
    vec3 reflectVec = reflect(-lightVec, normalize(normal));\
    float spec = pow(max(dot(viewVec, reflectVec), 0.0), 32.0);\
    vec3 specVec = 0.5 * spec * lightColor;\
    float diff = max(dot(normalize(normal), lightVec), 0.0);\
    vec3 diffVec = diff * lightColor;\
    vec3 ambVec = 0.1 * lightColor;\
    gl_FragColor = vec4(((diffVec + specVec + ambVec) * objectColor), 1);\
}\
  ');
var shader_phong_rail = new GL.Shader('\
  varying vec3 normal;\
  varying vec3 FragPos;\
  void main() {\
    normal = gl_NormalMatrix * gl_Normal;\
    vec4 FragPosPre = gl_ModelViewMatrix * gl_Vertex;\
    FragPos = (gl_ModelViewMatrix * gl_Vertex).xyz;\
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
  }\
  ','\
  varying vec3 normal;\
  varying vec3 FragPos;\
  uniform vec3 lightPos;\
  uniform vec3 viewPos;\
  uniform float brightness;\
  const vec3 lightColor = vec3(1.0, 1.0, 1.0);\
  void main() {\
    vec3 objectColor = brightness * (normal * 0.5 + 0.5);\
    vec3 lightVec = normalize(lightPos - FragPos);\
    vec3 viewVec = normalize(viewPos - FragPos);\
    vec3 reflectVec = reflect(-lightVec, normalize(normal));\
    float spec = pow(max(dot(viewVec, reflectVec), 0.0), 32.0);\
    vec3 specVec = 0.5 * spec * lightColor;\
    float diff = max(dot(normalize(normal), lightVec), 0.0);\
    vec3 diffVec = diff * lightColor;\
    vec3 ambVec = 0.1 * lightColor;\
    gl_FragColor = vec4(((diffVec + specVec + ambVec) * objectColor), 1);\
}\
  ');

//draw rails
function fxyz(t){
  var ret = [];
  ret[0] = getPosition(t).x;
  ret[1] = getPosition(t).y;
  ret[2] = getPosition(t).z;
  return ret;
}
function fnormal(t){
  var ret = [];
  ret[0] = getProperties(t)["normal"].x;
  ret[1] = getProperties(t)["normal"].y;
  ret[2] = getProperties(t)["normal"].z;
  return ret;
}
var railMesh;
var lowerRailMesh;
var frontRailMesh;
var backRailMesh;
var capRailMesh;

var light = new GL.Vector(10, 20, 6);
var view = new GL.Vector(0, 0, 0);

function loadRailMesh(){
  //gl.pushMatrix();
  var t = 0.1;

  var vertices = [];
  var verticesCount = 0;
  var triangles = [];
  var trianglesCount = 0;

  var lower_vertices = [];
  var lower_vertices_count = 0;
  var lower_triangles = [];
  var lower_triangles_count = 0;

  var front_vertices = [];
  var front_vertices_count = 0;
  var front_triangles = [];
  var front_triangles_count = 0;

  var back_vertices = [];
  var back_vertices_count = 0;
  var back_triangles = [];
  var back_triangles_count = 0;

  var cap_vertices = [];
  var cap_triangles = [];

  var firstFlag = 1;
  while (t < 20){
    var current = fxyz(t);
    var c_normal = fnormal(t);
    var unit = (sphere_radius / 2) / Math.sqrt(c_normal[0] * c_normal[0] +
                                           c_normal[1] * c_normal[1] + 
                                           c_normal[2] * c_normal[2]);
    var x = current[0];
    var y = current[1];
    var z = current[2];
    var lower_x = current[0] - unit * c_normal[0];
    var lower_y = current[1] - unit * c_normal[1];
    var lower_z = current[2] - unit * c_normal[2]; 
    var vec1 = getProperties(t)["tangent"].cross(getProperties(t)["normal"]).unit();
    //var vec1 = getProperties(t)["normal"].divide(5);
    //console.log(vec1);
    vertices[verticesCount] = [x + vec1.x, y + vec1.y, z + vec1.z];   
    vertices[verticesCount + 1] = [x - vec1.x, y - vec1.y, z - vec1.z];
    verticesCount = verticesCount + 2;

    lower_vertices[lower_vertices_count] = [lower_x + vec1.x, lower_y + vec1.y, lower_z + vec1.z];
    lower_vertices[lower_vertices_count + 1] = [lower_x - vec1.x, lower_y - vec1.y, lower_z - vec1.z];
    lower_vertices_count = lower_vertices_count + 2;

    front_vertices[front_vertices_count] = [x + vec1.x, y + vec1.y, z + vec1.z];
    front_vertices[front_vertices_count + 1] = [lower_x - vec1.x, lower_y - vec1.y, lower_z - vec1.z];
    front_vertices_count = front_vertices_count + 2;

    back_vertices[back_vertices_count] = [x + vec1.x, y + vec1.y, z + vec1.z];
    back_vertices[back_vertices_count + 1] = [lower_x - vec1.x, lower_y - vec1.y, lower_z - vec1.z];
    back_vertices_count = back_vertices_count + 2;

    if (firstFlag == 1){
      cap_vertices[0] = [x + vec1.x, y + vec1.y, z + vec1.z];
      cap_vertices[1] = [x - vec1.x, y - vec1.y, z - vec1.z];
      cap_vertices[2] = [lower_x + vec1.x, lower_y + vec1.y, lower_z + vec1.z];
      cap_vertices[3] = [lower_x - vec1.x, lower_y - vec1.y, lower_z - vec1.z];
      firstFlag = 0;
    }
    cap_vertices[4] = [x + vec1.x, y + vec1.y, z + vec1.z];
    cap_vertices[5] = [x - vec1.x, y - vec1.y, z - vec1.z];
    cap_vertices[6] = [lower_x + vec1.x, lower_y + vec1.y, lower_z + vec1.z];
    cap_vertices[7] = [lower_x - vec1.x, lower_y - vec1.y, lower_z - vec1.z];

    t = t + 0.05;
  }
  for(var i = 0; i < vertices.length - 2; i++){
    if (i % 2 == 0){
      triangles[trianglesCount] = [i, i+2, i+1];
      trianglesCount++;
      lower_triangles[lower_triangles_count] = [i+1, i+2, i];
      lower_triangles_count++;
      front_triangles[front_triangles_count] = [i, i+2, i+1];
      front_triangles_count++;
      back_triangles[back_triangles_count] = [i + 1, i+2, i];
      back_triangles_count++;
    }
    else{
      triangles[trianglesCount] = [i, i+1, i+2];
      trianglesCount++;
      lower_triangles[lower_triangles_count] = [i+2, i+1, i];
      lower_triangles_count++;
      front_triangles[front_triangles_count] = [i, i+1, i+2];
      front_triangles_count++
      back_triangles[back_triangles_count] = [i + 2, i+1, i];
      back_triangles_count++;
    }
  }

  cap_triangles[0] = [0, 1, 3];
  cap_triangles[1] = [2, 0, 3];
  cap_triangles[2] = [5, 6, 7];
  cap_triangles[3] = [6, 5, 4];

  var data = {
   vertices: vertices,
   triangles: triangles
  };
  var lower_data = {
    vertices: lower_vertices,
    triangles: lower_triangles
  }
  var front_data = {
    vertices: front_vertices,
    triangles: front_triangles
  }
  var back_data = {
    vertices: back_vertices,
    triangles: back_triangles
  }
  var cap_data = {
    vertices: cap_vertices,
    triangles: cap_triangles
  }
  var nmesh = GL.Mesh.load(data).computeNormals();
  railMesh = nmesh;
  var lower_nmesh = GL.Mesh.load(lower_data).computeNormals();
  lowerRailMesh = lower_nmesh;
  frontRailMesh = GL.Mesh.load(front_data).computeNormals();
  backRailMesh = GL.Mesh.load(back_data).computeNormals();
  capRailMesh = GL.Mesh.load(cap_data).computeNormals();

  return nmesh;

}

loadRailMesh();
function drawRail(){
  gl.pushMatrix();
  var ccLight = gl.modelviewMatrix.transformPoint(light);
  var ccView = gl.modelviewMatrix.transformPoint(camera);
  shader_phong_rail.uniforms({brightness: 1, viewPos: ccView, lightPos: ccLight}).draw(railMesh, gl.TRIANGLES);
  //shader2.uniforms({brightness:1}).draw(railMesh, gl.LINES);
  shader_phong_rail.uniforms({brightness: 1, viewPos: ccView, lightPos: ccLight}).draw(lowerRailMesh, gl.TRIANGLES);
  shader_phong_rail.uniforms({brightness: 1, viewPos: ccView, lightPos: ccLight}).draw(frontRailMesh, gl.TRIANGLES);
  shader_phong_rail.uniforms({brightness: 1, viewPos: ccView, lightPos: ccLight}).draw(backRailMesh, gl.TRIANGLES);
  shader_phong_rail.uniforms({brightness: 1, viewPos: ccView, lightPos: ccLight}).draw(capRailMesh, gl.TRIANGLES);
  gl.popMatrix();
}

loadSkyBoxMesh();
function drawSkyBox(){
  gl.pushMatrix();
    skybox_down.bind(0);
	gl.pushMatrix();
	gl.translate(0, -150, 0);
  	gl.rotate(-90, 1, 0, 0);
    shader_skybox.uniforms({texture:0}).draw(plane_mesh);
	gl.popMatrix();
	gl.pushMatrix();
	gl.translate(0, 0, -150);
	skybox_front.bind(1);
    shader_skybox.uniforms({texture:1}).draw(plane_mesh);
	gl.popMatrix();
	gl.pushMatrix();
	gl.translate(-150, 0, 0);
	gl.rotate(90, 0, 1, 0);
	skybox_right.bind(2);
    shader_skybox.uniforms({texture:2}).draw(plane_mesh);
	gl.popMatrix();
	gl.pushMatrix();
	gl.translate(150, 0, 0);
	gl.rotate(-90, 0, 1, 0);
	skybox_left.bind(3);
    shader_skybox.uniforms({texture:3}).draw(plane_mesh);
	gl.popMatrix();
	gl.pushMatrix();
	gl.translate(0, 150, 0);
	gl.rotate(90, 1, 0, 0);
	skybox_up.bind(4);
    shader_skybox.uniforms({texture:4}).draw(plane_mesh);
	gl.popMatrix();
	gl.pushMatrix();
	gl.translate(0, 0, 150);
	gl.rotate(180, 0, 1, 0);
	skybox_back.bind(5);
    shader_skybox.uniforms({texture:5}).draw(plane_mesh);
	gl.popMatrix();

  gl.popMatrix();
}

// mouse events
gl.onmousemove = function(e) {
  if (e.dragging) {
    angleY -= e.deltaX * 0.25;
    angleX = Math.max(-90, Math.min(90, angleX - e.deltaY * 0.25));
  }
};

var index = 0;
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

// mouse events
gl.onmousemove = function(e) {
  if (e.dragging) {
    angleY -= e.deltaX * 0.25;
    angleX = Math.max(-90, Math.min(90, angleX - e.deltaY * 0.25));
  }
};

// scene renderer
gl.ondraw = function() {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.loadIdentity();
  // camera
  gl.rotate(-angleX, 1, 0, 0);
  gl.rotate(-angleY, 0, 1, 0);
  gl.translate(-camera.x, -camera.y, -camera.z);
  var cLight = gl.modelviewMatrix.transformPoint(light);
  var cView = gl.modelviewMatrix.transformPoint(camera);
  // ball
  gl.pushMatrix();
  gl.translate(ballPos.x, ballPos.y, ballPos.z);
  gl.rotate(rotate, rotateAxis.x, rotateAxis.y, rotateAxis.z);
  shader_phong.uniforms({ brightness: 1 , viewPos: cView, lightPos: cLight}).draw(mesh, gl.TRIANGLES);
  shader.uniforms({ brightness: 0}).draw(mesh, gl.LINES);
  gl.popMatrix();
  // plane
  drawRail();
  drawSkyBox();
};


gl.fullscreen();
gl.animate();
gl.enable(gl.CULL_FACE);
gl.enable(gl.POLYGON_OFFSET_FILL);
gl.polygonOffset(1, 1);
gl.clearColor(0.8, 0.8, 0.8, 1);
gl.enable(gl.DEPTH_TEST);
