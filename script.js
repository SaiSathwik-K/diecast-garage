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

camera.position.set(16.396326562568426, 5.566901629526235, 4.565670187751327);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 10;
controls.maxDistance = 18;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.minAzimuthAngle = Math.PI/2;
controls.maxAzimuthAngle = Math.PI/2;
controls.target = new THREE.Vector3(0.3947764581126974, -0.6228893051537436, 4.294459922559769);
controls.update();


const ambientLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambientLight);

// Store the cars and their hitboxes
const carGroups = [];
const hitBoxes = [];

const loader = new GLTFLoader().setPath(
    `${import.meta.env.BASE_URL}models/`
);

loader.load('garage_newsf90.glb', (gltf) => {

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

    const models = [
        sf90,
        car812,
        clk,
        dakar,
        temerario,
        f12
    ];

    for (const model of models) {

        const { group, hitbox } = createCarGroup(model);

        carGroups.push(group);
        hitBoxes.push(hitbox);
    }
});

function createCarGroup(car) {
    console.log(car.name, {
    position: car.position.clone(),
    rotation: car.rotation.clone(),
    scale: car.scale.clone(),
    parent: car.parent?.name
    });

    // Calculate bounding box BEFORE changing hierarchy
    const box = new THREE.Box3().setFromObject(car);

    const size = new THREE.Vector3();
    box.getSize(size);

    const center = new THREE.Vector3();
    box.getCenter(center);

    console.log(
    car.name,
    "car position:", car.position.clone(),
    "box center:", center.clone(),
    "difference:", center.clone().sub(car.position)
    );
    if (car.name === "SF90"){
        size.y *= 0.7;
    }
    if (car.name === "812") {
        size.z *= 0.5;
    }

    if (car.name === "clk") {
        size.z *= 0.4;
        size.x *= 0.8;
    }

    if (car.name === "f12") {
        size.z *= 0.5;
    }

    if (car.name === "Dakar") {
        size.z *= 0.5;
    }

    if (car.name === "Temerario") {
        size.z *= 0.5;
    }


    // Create hitbox
    const geometry = new THREE.BoxGeometry(
        size.x,
        size.y,
        size.z
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
    });

    const hitbox = new THREE.Mesh(geometry, material);


    //Create group
    const group = new THREE.Group();
    group.name = `${car.name}_Group`;
    const parent = car.parent;
    group.position.copy(car.position);
    parent.add(group);
    group.add(car);

    //Group owns the position now
    car.position.set(0, 0, 0);
    group.worldToLocal(center);

    console.log(
    car.name,
    "local hitbox center:",
    center.clone()
);

    //Adding the hitbox
    hitbox.position.copy(center);
    group.add(hitbox);

    hitbox.userData.carGroup = group;

    group.userData.model = car;
    group.userData.hitbox = hitbox;
    group.userData.baseY = group.position.y;

    console.log(
    group.name,
    "GROUP PARENT:",
    group.parent?.name,
    "CAR PARENT:",
    car.parent?.name,
    "HITBOX PARENT:",
    hitbox.parent?.name
    );


    return {
        group,
        hitbox
    };

    

}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let needsRaycast = false;
let hoveredCarGroup = null;
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
            hoveredCarGroup = hit.object.userData.carGroup;
            console.log(
                "HIT:",
                hoveredCarGroup.name
            );
            document.body.style.cursor = "pointer";
        } else {
            hoveredCarGroup = null;
            document.body.style.cursor = "";
        }
        needsRaycast = false;
    }
    for (const group of carGroups) {

    const targetY =
        group === hoveredCarGroup
            ? group.userData.baseY + HOVER_Y
            : group.userData.baseY;

    group.position.y +=
        (targetY - group.position.y) * 0.1;
}
    renderer.render(
        scene,
        camera
    );
    requestAnimationFrame(animate);
    console.log("live camera position", camera.position.x, camera.position.y, camera.position.z);
    console.log("target", controls.target);
}

animate();