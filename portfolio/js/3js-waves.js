/***********
 * challengeMFWA-01.js
 * CISC681
 * Assignment 4
 *
 * B. Tucker
 * Winter 2016
 *
 *Creating a grid of squares that oscillate after a click
 *
 *
 ***********/

var camera, scene, renderer;
var cameraControls;
var clock = new THREE.Clock();

var squares;
var projector = new THREE.Projector();
var theSelectedSquare = null;
var theObjects = [];
var canvasWidth, canvasHeight;

var m = 60, n = 60;
var offset = 2.4;
var waveRate = 8.0;
//var curWave = null;
var waveLimit = 30;

var plainColor = null;
var nbrColors = 201;
var colors;

var maxHeight = 5.5;
var minHeight = -5.5;
var heightRange = maxHeight - minHeight;


var waves = []; /* when a wave is introduced, a sub array is added with:
    0 - Selected matrix object (nearest object to the click)
    1 - the wave rate
    2 - the wave limit
    3 - the wave propagation
    4 - flag for when the wave affects a matrix object */

function squareGeom() {
    var geom = new THREE.Geometry();
    var vertices = [new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(-1, -1, 0), new THREE.Vector3(-1, 1, 0)];
    for (var i = 0; i < vertices.length; i++)
        geom.vertices.push(vertices[i]);
    var faces = [[0, 1, 3], [3, 1, 2]];
    var normal = new THREE.Vector3(0, 0, 1);
    for (var i = 0; i < faces.length; i++)
        geom.faces.push(new THREE.Face3(faces[i][0], faces[i][1], faces[i][2], normal));
    return geom;
}

function createMatrixOfSquares(m, n, offset) {
    // fit into 10x10 square
    var root = new THREE.Object3D();
    root.scale.x = 10 / m*offset;
    root.scale.y = 10 / n*offset;

    // array of square meshes
    squares = new Array(m);
    for (var i = 0; i < m; i++) {
        squares[i] = new Array(n);
    }

    offset = offset !== undefined ? offset : 2.0;
    var geom = squareGeom();
    var xMin = -offset * ((m-1) / 2.0);
    var yMin = -offset * ((n-1) / 2.0);
    var mn = m * n;
    for (var i = 0, x = xMin; i < m; i++, x += offset) {
        for (var j = 0, y = yMin; j < n; j++, y += offset) {
            var mat = new THREE.MeshBasicMaterial({color: plainColor, shading: THREE.FlatShading, side: THREE.DoubleSide});
            var square = new THREE.Mesh(geom, mat);
            square.position.x = x;
            square.position.y = y;
            square.i = i;
            square.j = j;
            root.add(square);
            theObjects.push(square);
            squares[i][j] = square;
        }
    }
    scene.add(root);
}



function heightFunction(delta, dist) {
    return (maxHeight/2) * Math.sin(0.5*delta);
}

function colorFunction(ht, delta, dist) {
    var colorIndex = Math.floor(((ht - minHeight) / heightRange) * nbrColors);
    return colors[colorIndex];
}


function updateSquares() {
    var waveFinishedCounter = 0;
    var waveHeights;
    var objHeight;
    var dist;
    var delta;
    var objAffectedFlag;
    var ht;

    for(var i = 0; i < waves.length; i++){
        // Set all changed flags to false
        waves[i][4] = false;
    }

    for (var i = 0; i < theObjects.length; i++) {
        // Working with each object in the matrix...
        var obj = theObjects[i];
        objAffectedFlag = false;
        waveHeights = [];
        objHeight = 0;
        // For each wave going on...
        for (var j = 0; j < waves.length; j++) {
            dist = distance(waves[j][0], obj);
            delta = waves[j][3] - dist;
            if (delta > waves[j][2]) {
                waveHeights.push(0); // no height from this wave for this obj
            } else if (delta > 0) {
                ht = heightFunction(delta, dist);
                waveHeights.push(ht); // the height value from this wave
                waves[j][4] = true; // changed flag set
                objAffectedFlag = true;
            }
        }

        //Get a consolidated height value for the obj
        for(var y = 0; y < waveHeights.length; y++) {
            objHeight += waveHeights[y];
        }
        if(objHeight > maxHeight){
            objHeight = maxHeight - (heightRange/nbrColors);
        } else if (objHeight < minHeight) {
            objHeight = minHeight +(heightRange/nbrColors);
        }

        obj.position.z = objHeight;

        // Adjust this obj's material color if needed...
        if (objAffectedFlag == false){
            obj.material.color = plainColor;
        } else {
            obj.material.color = colorFunction(objHeight, delta, dist);
        }

    }
    // Check each wave to see if it is still active
    for (var i = 0; i < waves.length; i++){
        if(!waves[i][4]){
            //This wave didn't change anything.
            //Assuming the waves are first in first finished
            //Increment the counter of finished waves, then remove the waves from the front
            // of the array.
            waveFinishedCounter += 1;
        }
    }
    for (var i = 0; i < waveFinishedCounter; i++){
        if (waves.length == 1){
            waves=[];
        } else {
            waves.shift();
        }
    }

}

function distance(sq1, sq2) {
    dx = sq1.i - sq2.i;
    dy = sq1.j - sq2.j;
    return Math.sqrt(dx*dx + dy*dy);
}


function createScene() {
    initializeColors();
    var matrixOfSquares = createMatrixOfSquares(m, n, offset);
    scene.add(matrixOfSquares);
}

function initializeColors() {
    if (nbrColors % 2 == 0) {
        nbrColors++;
    }
    colors = new Array(nbrColors);
    nbrColors2 = (nbrColors - 1) / 2;
    var hues = [Math.random(), Math.random()];
    for (var j = 0; j < nbrColors2; j++) {
        var sat = 1 - j/nbrColors2;
        colors[j] = new THREE.Color().setHSL(hues[0], sat, 0.5);
        colors[nbrColors-j-1] = new THREE.Color().setHSL(hues[1], sat, 0.5);
    }
    plainColor = colors[nbrColors2] = new THREE.Color().setHSL(0, 0, 0.5);
}


function onDocumentMouseDown(event) {
    //var mouseVec = new THREE.Vector3(2*(event.clientX/canvasWidth)-1,1-2*(event.clientY/canvasHeight), 0);
    var mouseVec = new THREE.Vector3(2*(event.clientX/canvasWidth)-1,1-2*(event.clientY/canvasHeight), 0);
    var raycaster = projector.pickingRay(mouseVec.clone(), camera);
    var intersects = raycaster.intersectObjects(theObjects);
    if (intersects.length > 0) {
        // select the closest intersected object
        var selectedSquare = intersects[0].object;
        selectedSquare.material.color = new THREE.Color(0xff0000);
        //Add a wave to the array.
        var newWave = []; // new sub array.
        newWave.push( selectedSquare ); // 0 The selected object
        newWave.push(waveRate); // 1 Wave rate
        newWave.push(waveLimit); // 2 Wave limit
        newWave.push(0); // 3 curWave value
        newWave.push(false); // 4 flag showing the wave affected the objects
        waves.push(newWave);
    }
}

//document.addEventListener('mousedown', onDocumentMouseDown, false);


function animate() {
    window.requestAnimationFrame(animate);
    render();
}


function render() {
    var delta = clock.getDelta();
    if (waves.length > 0) {
        for (var i = 0; i < waves.length; i++) {
            waves[i][3] += (waves[i][1] * delta);
        }
        updateSquares();
    }

    cameraControls.update(delta);
    renderer.render(scene, camera);
}


function init() {
    var container = document.getElementById('container');
    canvasWidth = $(container).width();
    canvasHeight = $(container).height();
    
    var canvasRatio = canvasWidth / canvasHeight;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({antialias : true});
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 1.0);

    camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
    camera.position.set(0, -40, 30);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
}


function onWindowResize( e ) {
    var container = document.getElementById('container');
    canvasWidth = $(container).width();
    canvasHeight = $(container).height();

    renderer.setSize( canvasWidth, canvasHeight );
    
}


function addToDOM() {
    var container = document.getElementById('container');
    var canvas = container.getElementsByTagName('canvas');
    if (canvas.length>0) {
        container.removeChild(canvas[0]);
    }
    container.appendChild( renderer.domElement );
    container.addEventListener('mousedown', onDocumentMouseDown, false);
    window.addEventListener( 'resize', onWindowResize );
}


function start(){
    try {
        init();
        createScene();
        addToDOM();
        render();
        animate();
    } catch(e) {
        var errorMsg = "Error: " + e;
        
    }
}

