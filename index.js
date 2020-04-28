import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

const canvas = document.createElement("canvas")
canvas.width = 960
canvas.height = 600
var context = canvas.getContext( 'webgl2', { alpha: false } );
document.body.appendChild(canvas)

function main() {
  var renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );
  renderer.autoClearColor = false;

  const camera = new THREE.OrthographicCamera(
    -1, // left
     1, // right
     1, // top
    -1, // bottom
    -1, // near,
     1, // far
  );
  const scene = new THREE.Scene();
  const plane = new THREE.PlaneBufferGeometry(2, 2);


  //#include <common>
  const fragmentShader = `
  uniform vec3 iResolution;
  uniform float iTime;

  const float backboneWidth = 0.1;
  const float width = 0.5;
  const float verticalLoops = 3.0;
  const float timeFactor = 0.1; //Time for the entire model to scroll off the screen.

  const float PI = 3.1415926;
  //Note: Currently the model flips every 10 seconds (when timefactor is 0.1). This is a bug.

  float noise(float n){return (fract(sin(n) * 43758.5453123))/2. + 0.5;}
  vec3[16] colorValues = vec3[16](
      vec3(1.,1.,0.),
  	vec3(0.,1.,0.),
  	vec3(1.,0.,1.),
  	vec3(0.,0.,1.),
  	vec3(0.,1.,0.),
  	vec3(1.,0.,1.),
  	vec3(1.,1.,0.),
  	vec3(0.,0.,1.),
     	vec3(0.,1.,0.),
  	vec3(1.,0.,1.),
  	vec3(1.,1.,0.),
  	vec3(0.,0.,1.),
      vec3(0.,1.,0.),
  	vec3(1.,0.,1.),
  	vec3(1.,1.,0.),
  	vec3(0.,0.,1.)
  );

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      // Normalized pixel coordinates (from 0 to 1)
      vec2 uv = fragCoord/iResolution.xy;

      vec3 col;
      col.x = 1. - (0.5 * (uv.x + uv.y));
      col.y = 1.;
      col.z = 1.;

      //Distance from x=0.5 the backbone is from the center.
      float lineRelativeToCenter = cos((uv.y + mod(iTime * timeFactor, 1.)) * PI * verticalLoops);
      float backboneOffsetFromCenter = width / 2. * abs(lineRelativeToCenter);

      float pixelDistanceFromCenter = abs(uv.x - 0.5);

      if (abs(pixelDistanceFromCenter - backboneOffsetFromCenter) < backboneWidth / 2.) {
      	col.x = 0.;
          col.y = 0.;
          col.z = 0.;
      }
      if (((pixelDistanceFromCenter + backboneWidth / 2.) - backboneOffsetFromCenter) < 0.) {
          //In between rings

          float relativeYPosition = acos(abs(lineRelativeToCenter));

          if (
          	(relativeYPosition < 0.95 && relativeYPosition > 0.75)
              || (relativeYPosition < 0.4 && relativeYPosition > 0.2)

          ) {
              col.x = 0.;
          	col.y = 0.;
          	col.z = 0.;

              int index = int(mod((uv.y + mod(iTime * timeFactor, 1.)) * 16., 16.));
  			vec3 colorValue = colorValues[index];

              if (sign(uv.x - 0.5) == sign(lineRelativeToCenter)) {
          		col.x = colorValue.x;
                  col.y = colorValue.y;
                  col.z = colorValue.z;
          	}
              else {
              	col.x = abs(colorValue.x - 1.);
                  col.y = abs(colorValue.y - 1.);
              	col.z = abs(colorValue.z - 1.);
              }
          }
      }


      // Output to screen
      fragColor = vec4(col,1.0);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;
  const uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
  });
  scene.add(new THREE.Mesh(plane, material));

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds

    resizeRendererToDisplaySize(renderer);

    const canvas = renderer.domElement;
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value = time;

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
