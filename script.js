import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.outputColorSpace = THREE.SRGBColorSpace;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    1,
    1000
);

camera.position.set(25, 20, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 10;
controls.maxDistance = 18;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.target = new THREE.Vector3(0, 0, 0);
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambientLight);

// Store the cars and their hitboxes
const cars = [];
const hitBoxes = [];

const loader = new GLTFLoader().setPath(
    `${import.meta.env.BASE_URL}models/`
);

loader.load('garage.glb', (gltf) => {
    const mesh = gltf.scene;
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    gltf.scene.traverse((child) => {

        console.log(
            child.name,
            child.type,
            child.parent?.name
        );

    });

    const sf90 = gltf.scene.getObjectByName("SF90");
    const car812 = gltf.scene.getObjectByName("812");
    const clk = gltf.scene.getObjectByName("clk");
    const dakar = gltf.scene.getObjectByName("Dakar");
    const temerario = gltf.scene.getObjectByName("Temerario");
    const f12 = gltf.scene.getObjectByName("f12");

    // Keep references to both cars
    cars.push(sf90, car812, clk, dakar, temerario, f12);

    // Create hitboxes
    hitBoxes.push(createHitbox(sf90));
    hitBoxes.push(createHitbox(car812));
    hitBoxes.push(createHitbox(clk));
    hitBoxes.push(createHitbox(temerario));
    hitBoxes.push(createHitbox(f12));
    hitBoxes.push(createHitbox(dakar));

});

function createHitbox(car) {

    //remember where this car originally sits
    car.userData.baseY = car.position.y;

    //calculate bounding box around the car
    const box = new THREE.Box3().setFromObject(car);

    //get size of bounding box
    const size = new THREE.Vector3();

    box.getSize(size);

    //get center of bounding box
    const center = new THREE.Vector3();
    box.getCenter(center);

    //make the 812 hitbox smaller
    if (car.name === "812"){
        size.z *= 0.5;
    }
    if (car.name === "clk"){
        size.z *= 0.4;
        size.x *= 0.8;
    }
    if (car.name === "f12"){
        size.z *= 0.5;
    }
    if (car.name === "Dakar"){
        size.z *= 0.5;
    }
    if (car.name === "Temerario"){
        size.z *= 0.5;
    }

    //create actual hitbox geometry
    const geometry = new THREE.BoxGeometry(
        size.x,
        size.y,
        size.z
    );

    //creating and rendering the hitbox
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
    });

    const hitbox = new THREE.Mesh(
        geometry,
        material
    );

    //put hitbox around car
    hitbox.position.copy(center);

    //remember which car this hitbox belongs to
    hitbox.userData.car = car;
    car.userData.hitbox = hitbox;
    scene.add(hitbox);
    return hitbox;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let needsRaycast = false;
let hoveredCar = null;
const HOVER_Y = 0.4;

function onPointerMove(event) {
    const rect =
        renderer.domElement.getBoundingClientRect();
    pointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;
    needsRaycast = true;
}

controls.addEventListener("change", () => {
    needsRaycast = true;
});

function handleWindowResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect =
        sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(
        sizes.width,
        sizes.height
    );
}

window.addEventListener("resize", handleWindowResize);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", onclick);

function animate() {
    controls.update();
    if (needsRaycast) {
        raycaster.setFromCamera(
            pointer,
            camera
        );
        const intersects =
            raycaster.intersectObjects(hitBoxes);
        if (intersects.length > 0) {
            const hit = intersects[0];
            hoveredCar =
                hit.object.userData.car;
            console.log(
                "HIT:",
                hoveredCar.name
            );
            document.body.style.cursor = "pointer";
        } else {
            hoveredCar = null;
            document.body.style.cursor = "";
        }
        needsRaycast = false;
    }
    for (const car of cars) {

        const targetY =
            car === hoveredCar
                ? car.userData.baseY + HOVER_Y
                : car.userData.baseY;
        car.position.y +=
            (targetY - car.position.y) * 0.1;
    }
    renderer.render(
        scene,
        camera
    );
    requestAnimationFrame(animate);
}

animate();