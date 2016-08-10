// helpers
var EPSILON = 0.0000001;

function projection(vec1, vec2) {
	vec1.x
}


var four = 4;
var three = 3;
var two = 2;

// fields and important functions
/*var points = 
	[new GL.Vector(-5, 15, 5),
	new GL.Vector(-5, 14, 6),
	new GL.Vector(-4, 12, 7),
	new GL.Vector(-4, 10, 9),
	new GL.Vector(-3, 7, 10),
	new GL.Vector(-3, 4, 10),
	new GL.Vector(-2, 2, 11),
	new GL.Vector(-1, 1,11),
	new GL.Vector(0, 0, 11),
	new GL.Vector(2, 0, 10),
	new GL.Vector(4, 0, 10),
	new GL.Vector(5, 1, 9),
	new GL.Vector(6, 1, 8),
	new GL.Vector(6, 2, 8),
	new GL.Vector(6, 3, 7),
	new GL.Vector(5, 5, 8),
	new GL.Vector(4, 8, 9),
	new GL.Vector(3, 10, 10),
	new GL.Vector(4, 12, 12),
	new GL.Vector(5, 15, 13)];
*/
var points = 
	[new GL.Vector(10, 10, 5),
	new GL.Vector(10, 7, 5),
	new GL.Vector(9, 5, 5),
	new GL.Vector(8, 3, 5),
	new GL.Vector(7, 2, 5),
	new GL.Vector(6, 1, 5),
	new GL.Vector(4, 0, 5),
	new GL.Vector(2, -1, 5),
	new GL.Vector(-1, -1, 5),
	new GL.Vector(-3, 0, 5),
	new GL.Vector(-5, 1, 5),
	new GL.Vector(-6, 2, 5),
	new GL.Vector(-7, 4, 5),
	new GL.Vector(-8, 6, 5),
	new GL.Vector(-8, 9, 5),
	new GL.Vector(-7, 11, 5),
	new GL.Vector(-6, 13, 5),
	new GL.Vector(-5, 15, 5),
	new GL.Vector(-3, 16, 5),
	new GL.Vector(-1, 17, 5),
	new GL.Vector(2, 18, 5)];

var normalsCache = new Array(points.length * 20);
var tangentsCache = new Array(points.length * 20);
var RCache = new Array(points.length * 20);


var last = points.length - 1;
var tangents = new Array(points.length);
tangents[0] = new GL.Vector(points[1].x - points[0].x, 0, points[1].z - points[0].z).divide(two);
tangents[last] = new GL.Vector(points[last].x - points[last - 1].x, 0, points[last].z - points[last - 1].z).divide(two);
var lastPoint = points[last].add(tangents.last).multiply(two);

for (var i = 1; i < last; i++) {
	tangents[i] = points[i + 1].subtract(points[i - 1]).divide(two);
}

function getPosition(index) {
	if (index < 0) {
		return points[0].add(tangents[0].multiply(index));
	}
	if (index > last) {
		return points[last].add(tangents[last].multiply(index - last));
	}
	var point1 = Math.floor(index);
	var point2 = point1 + 1;
	var s = index - point1
	if (Math.abs(point2 - index) < EPSILON) return points[point2];
	else if (Math.abs(point1 - index) < EPSILON) return points[point1];
	
	var x0 = points[point1];

	var x3 = points[point2];
	var x1 = x0.add(tangents[point1].divide(three));
	var x2 = x3.subtract(tangents[point2].divide(three));
	var result = x0.add((x1.subtract(x0)).multiply(s).multiply(three))
		.add((x0.add(x2).subtract(x1.multiply(two))).multiply(s).multiply(s).multiply(three))
		.add((x3.add(x1.multiply(three)).subtract(x2.multiply(three)).subtract(x0)).multiply(s).multiply(s).multiply(s));
	return result;
}

//set normal and R at origin
var zeroNormal;
var zeroR;
if (tangents[0].angleTo(tangents[1]) < EPSILON) {
	var outVec = new GL.Vector(0, 0, 1);
	if (Math.abs(tangents[0].angleTo(outVec)) < EPSILON) zeroNormal = tangents[0].dot(new GL.Vector(1, 0, 0)).unit();
	else zeroNormal = tangents[0].dot(outVec).unit();
	zeroR = -1;
} else {	
	var prev = getPosition(-1);
	var next = getPosition(0);
	var here = getPosition(1);
	// normal and radius
	var a = next.subtract(here);
	var b = prev.subtract(here);
	var aMag = a.length();
	var bMag = b.length();
	var aCrossb = a.cross(b);
	zeroR = aMag * bMag * a.subtract(b).length() / 2 / aCrossb.length();
	var aCb2 = aCrossb.dot(aCrossb) * 2;
	var a2 = a.dot(a);
	var b2 = b.dot(b);
	var C = ((aCrossb.cross(a).multiply(b2)).add(b.cross(aCrossb).multiply(a2))).divide(aCb2);
	zeroNormal = C.unit();
}

function getProps(index) {
	var ceil = Math.ceil(index);
	var i = Math.floor(index * 20);
	if (index - ceil + 1 < EPSILON) ceil -= 1;
	// tangent line
	var prev = getPosition(index - 1);
	var next = getPosition(index + 1);
	var here = getPosition(index);
	var a = next.subtract(here);
	var b = prev.subtract(here);
	var tangent = next.subtract(prev).multiply(5);

	var normal;
	var R;
	if (ceil == 0) {
		normal = zeroNormal;
		R = zeroR;
	} else if (tangents[ceil].angleTo(tangents[ceil - 1]) < EPSILON) {
		normal = normalsCache[i - 1];
		R = -1;
	} else {
		var aMag = a.length();
		var bMag = b.length();
		var aCrossb = a.cross(b);
		var R = aMag * bMag * a.subtract(b).length() / 2 / aCrossb.length();
		var aCb2 = aCrossb.dot(aCrossb) * 2;
		var a2 = a.dot(a);
		var b2 = b.dot(b);
		var C = (((b.multiply(a2)).subtract(a.multiply(b2))).cross(aCrossb)).divide(aCb2);
		//var C = ((aCrossb.cross(a).multiply(b2)).add(b.cross(aCrossb).multiply(a2))).divide(aCb2);
		normal = C.unit();
		if (index > 0 && index < last) {
			if (normalsCache[i - 1].dot(normal) <= 0) normal = normal.negative();
			if (normalsCache[i - 1].dot(normal) <= 0.5)  {
				normal = normal.add(normalsCache[i - 1]).unit();
			}
		}
	}

	return {"tangent": tangent, "normal": normal, "radius": R};
}

for (var i = 0; i <= last * 20; i++) {
	var props = getProps(i / 20);
	normalsCache[i] = props["normal"];
	tangentsCache[i] = props["tangent"];
	RCache[i] = props["radius"];
	console.log(props);
}

function getProperties(index) {
	var i = Math.floor(index * 20);
	if (i < 0 || i > points.length * 20) return getProps(index);
	return {"tangent": tangentsCache[i], "normal": normalsCache[i], "radius": RCache[i]};
}