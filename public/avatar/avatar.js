// =========================================================
// FIELDBRIK - AVATAR RENDERER
// =========================================================
//
// Staged client code. NOT wired into the website: the site keeps drawing its
// flat 2D avatar from the stored colours. This module is what the client will
// use once places, login and networking exist.
//
// Loaded straight from esm.sh for now so it can be opened and poked at.
// Before shipping it must be bundled locally: a downloadable client cannot
// depend on a CDN being reachable.
//
// ---------------------------------------------------------
// CHANGES FROM THE USER'S ORIGINAL
// ---------------------------------------------------------
//
// 1. FACE DOUBLE-SCALE BUG - the face plane was added as a child of the head
//    group *after* that group had been scaled, but it was sized and offset
//    from world-space bounds. Its final size was therefore multiplied by the
//    head scale a second time, and its z offset was multiplied by the same
//    factor. Below 1.278 world units of model height the scale is >1, so the
//    face floated off the front. Above it the face sank into the head. Fixed
//    by putting the scaled model inside an unscaled pivot and attaching the
//    face to the pivot, in true world units.
//
// 2. FACE TEXTURE HAD TWO SOURCES OF TRUTH - DEFAULT_AVATAR carried both a
//    `face` id and a `faceTexture` path, and the merge order silently let the
//    default path win. `faceTexture` is gone: the id is the only stored value.
//
// 3. MODEL AND TEXTURES WERE RE-FETCHED PER AVATAR - a people list with twenty
//    avatars downloaded head.obj twenty times. Both are cached now, and the
//    cached model is cloned per avatar.
//
// 4. THE RENDER LOOP RAN FOREVER - a static avatar burnt a frame callback at
//    60fps for as long as the page was open. Rendering is on demand now.
//
// 5. destroy() LEAKED - it disposed the renderer but no geometries, materials
//    or textures, and never stopped the loop. It now tears down properly.
//
// 6. ANTIALIASING - smooth edges fight a 2006 look. Off by default, with the
//    pixel ratio pinned to 1, both overridable.
//
// 7. resize USED window - the canvas is sized from the container now, via
//    ResizeObserver, and skips frames while the container has no size.
//
// 8. createBuildermanAvatar REMOVED - FieldBrik should not carry another
//    company's founder in its API. createDefaultAvatar replaces it.
//
// =========================================================

import * as THREE from "https://esm.sh/three@0.181.2";
import { OBJLoader } from "https://esm.sh/three@0.181.2/examples/jsm/loaders/OBJLoader.js";

// =========================================================
// PATHS
// =========================================================
//
// Served by the client bundle, not by the website. If the client is ever
// hosted somewhere other than the site root, change ASSET_BASE only.
//

const ASSET_BASE = "/avatar/assets";

const HEAD_MODEL_PATH = `${ASSET_BASE}/head.obj`;

// =========================================================
// FACES
// =========================================================
//
// The saved avatar stores a face ID. The renderer resolves it to a texture.
// Every face PNG must be the same dimensions with the features in the same
// position, because the plane is sized from the head, not from the image.
//
// These eight IDs are the canonical set. The database stores the ID and
// nothing else - never a path.
//

export const FACE_TEXTURES = {
    "classic-smile": `${ASSET_BASE}/face.png`,
    "chuckle": `${ASSET_BASE}/chuckle.png`,
    "silly": `${ASSET_BASE}/silly.png`,
    "durr": `${ASSET_BASE}/durr.png`,
    "oo": `${ASSET_BASE}/oo.png`,
    "glee": `${ASSET_BASE}/glee.png`,
    "notamused": `${ASSET_BASE}/notamused.png`,
    "meh": `${ASSET_BASE}/meh.png`
};

export const FACE_IDS = Object.keys(FACE_TEXTURES);

// =========================================================
// DEFAULT AVATAR
// =========================================================
//
// Any account without appearance data renders exactly as this. Every stored
// avatar should default to these colours so a new member looks like the
// starter character, not like an unstyled box.
//

export const DEFAULT_AVATAR = {
    headColor: "#ffcc00",
    torsoColor: "#f57c00",
    leftArmColor: "#111111",
    rightArmColor: "#111111",
    leftLegColor: "#111111",
    rightLegColor: "#111111",
    face: "classic-smile",

    // Resolved by the host from the equipped catalog item, not stored on the
    // avatar row. Null means no shirt overlay.
    shirtTexture: null
};

// =========================================================
// BODY DIMENSIONS
// =========================================================
//
// These are the proportions of the classic block figure. They are stored here
// rather than in the database: the site draws its flat avatar from the same
// numbers in CSS, and the schema only ever holds colours.
//

const BODY = {
    torso: { width: 2, height: 2.2, depth: 1 },
    arm: { width: 0.85, height: 2.2, depth: 1 },
    leg: { width: 0.9, height: 2.2, depth: 1 }
};

const GAPS = { head: 0.005, arms: 0.08, legs: 0 };

const HEAD_SCALE = 0.71;
const HEAD_TARGET_HEIGHT = 1.8 * HEAD_SCALE;

const AVATAR_LIFT = 0.15;

// Tuned against the supplied head.obj, which is symmetric about x = 0
// (bounding box -0.5906 to +0.5906) with its widest point at x = 0, so the
// face is centred. The original value of 0.06 pushed the face 4.4% of the
// head's width to the right.
const FACE_OFFSET_X = 0;

// The plane is square and covers 82% of the head's height, which puts the drawn
// features at exactly half the head's height (they occupy 61% of their canvas).
// At 0.68 the features sat in the middle 41% and read as too small.
//
// For reference, the classic look maps a face across the head's entire front
// face, which would be 1.0 here - the art inside the canvas already carries its
// own margins, so 1.0 is the ceiling rather than the target.
const FACE_SCALE = 0.82;

// The plane sits at the model's maximum depth, so it can never sink into the
// head. The head is domed rather than flat, so at eye level there is a small
// gap; this keeps it a hair in front without z-fighting.
const FACE_Z_EPSILON = 0.0005;

const SHIRT_Z_EPSILON = 0.004;

// =========================================================
// FALLBACK
// =========================================================
//
// Without head.obj there is no head and no avatar. Until the model is
// supplied, a plain box stands in so the rest of the renderer can be tested
// in a browser. It logs loudly, and it is not a substitute for the model.
//

const ALLOW_BOX_HEAD_FALLBACK = true;

// =========================================================
// CACHES
// =========================================================
//
// One download per asset per page, no matter how many avatars are on it.
//

const textureCache = new Map();
const objCache = new Map();

const textureLoader = new THREE.TextureLoader();
const objLoader = new OBJLoader();

function loadTexture(path) {
    if (!path) {
        return Promise.resolve(null);
    }

    if (textureCache.has(path)) {
        return textureCache.get(path);
    }

    const promise = new Promise((resolve, reject) => {
        textureLoader.load(
            path,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;

                // Nearest filtering keeps the art pixel-sharp at every size.
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.needsUpdate = true;

                resolve(texture);
            },
            undefined,
            () => reject(new Error(`FieldBrik: texture failed to load: ${path}`))
        );
    });

    // Cache the promise so parallel avatars share one request.
    textureCache.set(path, promise);
    return promise;
}

function loadOBJ(path) {
    if (objCache.has(path)) {
        return objCache.get(path);
    }

    const promise = new Promise((resolve, reject) => {
        objLoader.load(
            path,
            (object) => resolve(object),
            undefined,
            () => reject(new Error(`FieldBrik: model failed to load: ${path}`))
        );
    });

    objCache.set(path, promise);
    return promise;
}

// =========================================================
// COLOUR
// =========================================================
//
// The database stores "#rrggbb". Older avatar data and the original renderer
// store 0xRRGGBB integers. Both are accepted so neither side has to convert.
//

export function toColor(value) {
    if (typeof value === "number") {
        return new THREE.Color(value);
    }

    if (typeof value === "string" && value.trim() !== "") {
        return new THREE.Color(value.trim());
    }

    return new THREE.Color(0xffffff);
}

function makeColorMaterial(value) {
    return new THREE.MeshLambertMaterial({ color: toColor(value) });
}

// =========================================================
// HEAD
// =========================================================
//
// The pivot exists purely so the face can be positioned in true world units.
// Parenting the face to the scaled model is what caused the original bug.
//

function makeBoxHeadFallback() {
    console.warn(
        `FieldBrik: ${HEAD_MODEL_PATH} could not be loaded, using a box head. ` +
        "Supply head.obj - the box is only for testing the renderer."
    );

    const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
    mesh.name = "Head";

    const group = new THREE.Group();
    group.add(mesh);
    return group;
}

function createFace(size, texture) {
    const geometry = new THREE.PlaneGeometry(
        size.x * FACE_SCALE,
        size.y * FACE_SCALE
    );

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        side: THREE.FrontSide
    });

    const face = new THREE.Mesh(geometry, material);

    face.name = "Face";
    face.position.set(FACE_OFFSET_X, 0, size.z / 2 + FACE_Z_EPSILON);
    face.renderOrder = 10;

    return face;
}

async function createHead(appearance, faceTexture) {
    const pivot = new THREE.Group();
    pivot.name = "Head";

    let model;

    try {
        model = await loadOBJ(HEAD_MODEL_PATH);
    } catch (error) {
        if (!ALLOW_BOX_HEAD_FALLBACK) {
            throw error;
        }

        model = makeBoxHeadFallback();
    }

    // Clone so each avatar can carry its own colours without fighting over
    // shared materials. Geometry stays shared and is disposed once, globally.
    const mesh = model.clone(true);

    mesh.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        child.material = makeColorMaterial(appearance.headColor);
        child.castShadow = false;
        child.receiveShadow = false;
    });

    // Scale the model so its height matches the target, whatever units the
    // OBJ was authored in.
    const sourceBox = new THREE.Box3().setFromObject(mesh);
    const sourceSize = sourceBox.getSize(new THREE.Vector3());

    const scale =
        sourceSize.y > 0
            ? HEAD_TARGET_HEIGHT / sourceSize.y
            : 1;

    mesh.scale.set(scale, scale, scale);

    // Mirror the model about the origin so the pivot is the head centre.
    const scaledBox = new THREE.Box3().setFromObject(mesh);
    const scaledCentre = scaledBox.getCenter(new THREE.Vector3());

    mesh.position.sub(scaledCentre);

    pivot.add(mesh);

    const size = new THREE.Box3()
        .setFromObject(pivot)
        .getSize(new THREE.Vector3());

    if (faceTexture) {
        pivot.add(createFace(size, faceTexture));
    }

    pivot.userData.height = size.y;
    pivot.userData.width = size.x;
    pivot.userData.depth = size.z;

    return pivot;
}

// =========================================================
// SHIRT
// =========================================================
//
// Classic 585 x 559 shirt sheet. Each box face samples its own region instead
// of stretching the whole image over the torso.
//

const SHIRT_CANVAS = { width: 585, height: 559 };

const SHIRT_UV = {
    front: { x: 231, y: 74, width: 128, height: 128 },
    right: { x: 165, y: 74, width: 64, height: 128 },
    left: { x: 361, y: 74, width: 64, height: 128 },
    back: { x: 427, y: 74, width: 128, height: 128 },
    up: { x: 231, y: 8, width: 128, height: 64 },
    down: { x: 231, y: 204, width: 128, height: 64 }
};

function createShirtFace(texture, region, width, height, position, rotation) {
    const geometry = new THREE.PlaneGeometry(width, height);

    const u0 = region.x / SHIRT_CANVAS.width;
    const u1 = (region.x + region.width) / SHIRT_CANVAS.width;
    const v0 = 1 - (region.y + region.height) / SHIRT_CANVAS.height;
    const v1 = 1 - region.y / SHIRT_CANVAS.height;

    const uv = geometry.attributes.uv;

    uv.setXY(0, u0, v0);
    uv.setXY(1, u1, v0);
    uv.setXY(2, u0, v1);
    uv.setXY(3, u1, v1);
    uv.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.renderOrder = 5;
    mesh.frustumCulled = false;

    return mesh;
}

function createShirtOverlay(torso, shirtTexture) {
    if (!shirtTexture) {
        return;
    }

    const { width, height, depth } = BODY.torso;
    const offset = SHIRT_Z_EPSILON;

    const faces = [
        [
            "ShirtFront",
            SHIRT_UV.front,
            width,
            height,
            new THREE.Vector3(0, 0, depth / 2 + offset),
            new THREE.Euler(0, 0, 0)
        ],
        [
            "ShirtBack",
            SHIRT_UV.back,
            width,
            height,
            new THREE.Vector3(0, 0, -depth / 2 - offset),
            new THREE.Euler(0, Math.PI, 0)
        ],
        [
            "ShirtRight",
            SHIRT_UV.right,
            depth,
            height,
            new THREE.Vector3(width / 2 + offset, 0, 0),
            new THREE.Euler(0, Math.PI / 2, 0)
        ],
        [
            "ShirtLeft",
            SHIRT_UV.left,
            depth,
            height,
            new THREE.Vector3(-width / 2 - offset, 0, 0),
            new THREE.Euler(0, -Math.PI / 2, 0)
        ],
        [
            "ShirtTop",
            SHIRT_UV.up,
            width,
            depth,
            new THREE.Vector3(0, height / 2 + offset, 0),
            new THREE.Euler(-Math.PI / 2, 0, 0)
        ],
        [
            "ShirtBottom",
            SHIRT_UV.down,
            width,
            depth,
            new THREE.Vector3(0, -height / 2 - offset, 0),
            new THREE.Euler(Math.PI / 2, 0, 0)
        ]
    ];

    for (const [name, region, w, h, position, rotation] of faces) {
        const face = createShirtFace(
            shirtTexture,
            region,
            w,
            h,
            position,
            rotation
        );

        face.name = name;
        torso.add(face);
    }
}

// =========================================================
// AVATAR
// =========================================================

function createBodyPart(width, height, depth, material) {
    return new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );
}

function normalizeAvatarData(avatarData) {
    const data =
        avatarData && typeof avatarData === "object"
            ? avatarData
            : {};

    const appearance = { ...DEFAULT_AVATAR, ...data };

    // An unknown face ID falls back rather than throwing: a bad column in one
    // row should not blank out somebody's character.
    if (!FACE_TEXTURES[appearance.face]) {
        appearance.face = DEFAULT_AVATAR.face;
    }

    return appearance;
}

export async function createAvatar(avatarData = {}) {
    const avatar = new THREE.Group();
    avatar.name = "FieldBrikAvatar";

    const appearance = normalizeAvatarData(avatarData);

    const [faceTexture, shirtTexture] = await Promise.all([
        loadTexture(FACE_TEXTURES[appearance.face]).catch((error) => {
            console.warn("FieldBrik: face texture could not be loaded.", error);
            return null;
        }),
        loadTexture(appearance.shirtTexture).catch((error) => {
            console.warn("FieldBrik: shirt texture could not be loaded.", error);
            return null;
        })
    ]);

    const head = await createHead(appearance, faceTexture);

    const torsoTop =
        BODY.leg.height + GAPS.legs + BODY.torso.height;

    head.position.set(
        0,
        torsoTop + GAPS.head + head.userData.height / 2,
        0
    );

    const torso = createBodyPart(
        BODY.torso.width,
        BODY.torso.height,
        BODY.torso.depth,
        makeColorMaterial(appearance.torsoColor)
    );
    torso.name = "Torso";

    createShirtOverlay(torso, shirtTexture);

    const leftArm = createBodyPart(
        BODY.arm.width,
        BODY.arm.height,
        BODY.arm.depth,
        makeColorMaterial(appearance.leftArmColor)
    );
    leftArm.name = "LeftArm";

    const rightArm = createBodyPart(
        BODY.arm.width,
        BODY.arm.height,
        BODY.arm.depth,
        makeColorMaterial(appearance.rightArmColor)
    );
    rightArm.name = "RightArm";

    const leftLeg = createBodyPart(
        BODY.leg.width,
        BODY.leg.height,
        BODY.leg.depth,
        makeColorMaterial(appearance.leftLegColor)
    );
    leftLeg.name = "LeftLeg";

    const rightLeg = createBodyPart(
        BODY.leg.width,
        BODY.leg.height,
        BODY.leg.depth,
        makeColorMaterial(appearance.rightLegColor)
    );
    rightLeg.name = "RightLeg";

    const legY = BODY.leg.height / 2;
    const legX = BODY.leg.width / 2;

    leftLeg.position.set(-legX, legY, 0);
    rightLeg.position.set(legX, legY, 0);

    const torsoY =
        BODY.leg.height + GAPS.legs + BODY.torso.height / 2;

    torso.position.set(0, torsoY, 0);

    const armX =
        BODY.torso.width / 2 + BODY.arm.width / 2 + GAPS.arms;

    leftArm.position.set(-armX, torsoY, 0);
    rightArm.position.set(armX, torsoY, 0);

    avatar.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);

    avatar.position.y = AVATAR_LIFT;

    avatar.userData.avatar = appearance;

    return avatar;
}

// =========================================================
// DISPOSAL
// =========================================================
//
// Geometries and textures that live in the cache are shared between avatars
// and must not be freed when one of them goes away. Everything created per
// avatar is.
//

function collectShared() {
    const geometries = new Set();
    const textures = new Set();

    for (const promise of objCache.values()) {
        promise.then((object) => {
            object.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    geometries.add(child.geometry);
                }
            });
        });
    }

    for (const promise of textureCache.values()) {
        promise
            .then((texture) => {
                if (texture) {
                    textures.add(texture);
                }
            })
            .catch(() => {});
    }

    return { geometries, textures };
}

function disposeTree(root) {
    const { geometries, textures } = collectShared();

    root.traverse((child) => {
        if (!child.isMesh) {
            return;
        }

        if (child.geometry && !geometries.has(child.geometry)) {
            child.geometry.dispose();
        }

        const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

        for (const material of materials) {
            if (!material) {
                continue;
            }

            if (material.map && !textures.has(material.map)) {
                material.map.dispose();
            }

            material.dispose();
        }
    });
}

// =========================================================
// RENDERER
// =========================================================

const DEFAULT_VIEW_OPTIONS = {
    width: 220,
    height: 280,
    antialias: false,
    pixelRatio: 1,
    background: null
};

export function createAvatarRenderer(container, options = {}) {
    if (!container) {
        throw new Error("FieldBrik: Avatar container was not found.");
    }

    const settings = { ...DEFAULT_VIEW_OPTIONS, ...options };

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(4.2, 4.1, 10.9);
    camera.lookAt(0, 3.15, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(5, 10, 8);
    scene.add(mainLight);

    const renderer = new THREE.WebGLRenderer({
        antialias: settings.antialias,
        alpha: true
    });

    renderer.setPixelRatio(settings.pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(settings.background || 0xffffff, 0);

    let avatar = null;
    let running = true;
    let queued = false;
    let spinning = false;

    // =====================================================
    // SIZE
    // =====================================================

    function measure() {
        return {
            width: container.clientWidth || 0,
            height: container.clientHeight || 0
        };
    }

    function resize() {
        const { width, height } = measure();

        if (width === 0 || height === 0) {
            return false;
        }

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        invalidate();

        return true;
    }

    const observer =
        typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(resize)
            : null;

    if (observer) {
        observer.observe(container);
    } else {
        window.addEventListener("resize", resize);
    }

    if (!resize()) {
        // The container has no layout yet. Size to the fallback so the canvas
        // is not a zero-pixel square, then correct on the first observation.
        renderer.setSize(settings.width, settings.height, false);
        camera.aspect = settings.width / settings.height;
        camera.updateProjectionMatrix();
    }

    container.appendChild(renderer.domElement);

    // =====================================================
    // RENDER ON DEMAND
    // =====================================================
    //
    // A static portrait does not need 60 frames a second. One frame is drawn
    // per change, and only a spinning avatar runs a loop.
    //

    function draw() {
        if (!running) {
            return;
        }

        renderer.render(scene, camera);
    }

    function invalidate() {
        if (!running || queued || spinning) {
            return;
        }

        queued = true;

        requestAnimationFrame(() => {
            queued = false;
            draw();
        });
    }

    function spinFrame() {
        if (!running || !spinning) {
            return;
        }

        scene.rotation.y += 0.01;
        draw();
    }

    // =====================================================
    // CONTROLLER
    // =====================================================

    const view = {
        scene,
        camera,
        renderer,
        invalidate,

        get avatar() {
            return avatar;
        },

        setAvatar(next) {
            if (avatar) {
                scene.remove(avatar);
                disposeTree(avatar);
            }

            avatar = next;
            avatar.userData.view = view;
            scene.add(avatar);
            invalidate();

            return avatar;
        },

        async update(avatarData) {
            // Change Character: build the replacement first so a failed load
            // leaves the current avatar on screen instead of an empty frame.
            const next = await createAvatar(avatarData);
            return view.setAvatar(next);
        },

        setSpin(on) {
            spinning = Boolean(on);

            if (spinning) {
                renderer.setAnimationLoop(spinFrame);
                return;
            }

            renderer.setAnimationLoop(null);
            scene.rotation.y = 0;
            invalidate();
        },

        destroy() {
            running = false;
            spinning = false;

            renderer.setAnimationLoop(null);

            if (observer) {
                observer.disconnect();
            } else {
                window.removeEventListener("resize", resize);
            }

            if (avatar) {
                scene.remove(avatar);
                disposeTree(avatar);
                avatar = null;
            }

            renderer.dispose();

            const canvas = renderer.domElement;

            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    };

    return view;
}

// =========================================================
// INITIALIZE
// =========================================================
//
// const view = await initializeAvatar(container, avatarData);
// view.setSpin(true);
// view.destroy();
//

export async function initializeAvatar(
    container,
    avatarData = null,
    options = {}
) {
    const view = createAvatarRenderer(container, options);

    try {
        const avatar = await createAvatar(avatarData || DEFAULT_AVATAR);
        view.setAvatar(avatar);
        return view;
    } catch (error) {
        view.destroy();
        throw error;
    }
}

// =========================================================
// FALLBACK NOTE
// =========================================================
//
// If the client cannot create a WebGL context at all - an old machine, or a
// browser with acceleration switched off - initializeAvatar throws. The host
// should catch that and show the site's existing CSS avatar, which needs no
// canvas and no assets. That path already exists in the website's stylesheet
// as .fieldbrik-avatar-fallback.
//
