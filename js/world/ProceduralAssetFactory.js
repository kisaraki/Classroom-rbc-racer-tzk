import {
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DynamicDrawUsage,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LinearFilter,
  Matrix4,
  MeshStandardMaterial,
  OctahedronGeometry,
  Quaternion,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3
} from "../../vendor/three.module.js";
import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";

const LOCAL_Z_AXIS = new Vector3(0, 0, 1);

function requirePaletteColor(palette, colorKey) {
  const color = palette[colorKey];

  if (!color) {
    throw new RangeError("Unknown entity palette key: " + colorKey);
  }

  return color;
}

function createGeometry(part) {
  switch (part.geometry) {
    case "circle":
      return new CircleGeometry(...part.args);
    case "cone":
      return new ConeGeometry(...part.args);
    case "cylinder":
      return new CylinderGeometry(...part.args);
    case "dodecahedron":
      return new DodecahedronGeometry(...part.args);
    case "icosahedron":
      return new IcosahedronGeometry(...part.args);
    case "octahedron":
      return new OctahedronGeometry(...part.args);
    case "sphere":
      return new SphereGeometry(...part.args);
    case "torus":
      return new TorusGeometry(...part.args);
    case "torusKnot":
      return new TorusKnotGeometry(...part.args);
    case "irregularIcosahedron": {
      const geometry = new IcosahedronGeometry(...part.args);
      const positions = geometry.getAttribute("position");
      const [weightX, weightY, weightZ] = part.distortionAxisWeights;

      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const y = positions.getY(index);
        const z = positions.getZ(index);
        const wave = Math.sin(
          (x * weightX + y * weightY + z * weightZ) *
            part.distortionFrequency
        );
        const scale = 1 + wave * part.distortionAmplitude;
        positions.setXYZ(index, x * scale, y * scale, z * scale);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      return geometry;
    }
    default:
      throw new RangeError("Unknown procedural geometry: " + part.geometry);
  }
}

function createMaterial(part, palette) {
  return new MeshStandardMaterial({
    color: requirePaletteColor(palette, part.colorKey),
    emissive: requirePaletteColor(palette, part.emissiveColorKey),
    emissiveIntensity: part.emissiveIntensity,
    roughness: part.roughness,
    metalness: part.metalness
  });
}

function createLocalMatrix(part) {
  const position = new Vector3().fromArray(part.position);
  const rotation = new Quaternion().setFromEuler(
    new Euler(...part.rotation)
  );
  const scale = new Vector3().fromArray(part.scale);

  return new Matrix4().compose(position, rotation, scale);
}

function defaultCanvasFactory(documentRef) {
  if (!documentRef?.createElement) {
    throw new Error("CanvasTexture labels require a browser document.");
  }

  return documentRef.createElement("canvas");
}

export function createEntityLabelTexture(
  label,
  accentColorKey,
  {
    labelConfig = GAME_CONFIG.entityVisuals.label,
    palette = GAME_CONFIG.palette,
    documentRef = globalThis.document,
    canvasFactory = () => defaultCanvasFactory(documentRef)
  } = {}
) {
  if (typeof label !== "string" || label.length === 0) {
    throw new TypeError("Entity labels require visible text.");
  }

  const canvas = canvasFactory();
  canvas.width = labelConfig.canvasWidth;
  canvas.height = labelConfig.canvasHeight;
  const context = canvas.getContext?.("2d");

  if (!context) {
    throw new Error("Entity labels require a 2D canvas context.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = requirePaletteColor(
    palette,
    labelConfig.backgroundColorKey
  );
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = requirePaletteColor(palette, accentColorKey);
  context.lineWidth = labelConfig.borderWidth;
  context.strokeRect(
    labelConfig.borderWidth / 2,
    labelConfig.borderWidth / 2,
    canvas.width - labelConfig.borderWidth,
    canvas.height - labelConfig.borderWidth
  );
  context.fillStyle = requirePaletteColor(
    palette,
    labelConfig.textColorKey
  );
  context.font =
    labelConfig.fontWeight +
    " " +
    labelConfig.fontSize +
    "px " +
    labelConfig.fontFamily;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    label,
    canvas.width * labelConfig.horizontalTextRatio,
    canvas.height * labelConfig.verticalTextRatio
  );

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  texture.name = "procedural-entity-label-" + label;
  texture.userData.label = label;
  return texture;
}

export class ProceduralEntityBatch {
  #typeDefinition;
  #visualConfig;
  #labelConfig;
  #capacity;
  #parts;
  #labels = [];
  #labelTexture = null;
  #labelMaterial = null;
  #orientationMatrix = new Matrix4();
  #baseMatrix = new Matrix4();
  #combinedMatrix = new Matrix4();
  #backward = new Vector3();
  #position = new Vector3();
  #labelPosition = new Vector3();
  #scale = new Vector3();
  #orientation = new Quaternion();
  #spin = new Quaternion();
  #disposed = false;

  constructor({
    typeDefinition,
    visualConfig,
    labelConfig,
    capacity,
    palette,
    documentRef,
    canvasFactory
  }) {
    this.#typeDefinition = typeDefinition;
    this.#visualConfig = visualConfig;
    this.#labelConfig = labelConfig;
    this.#capacity = capacity;
    this.group = new Group();
    this.group.name = "entity-batch-" + typeDefinition.id;

    this.#parts = visualConfig.parts.map((part, partIndex) => {
      const geometry = createGeometry(part);
      const material = createMaterial(part, palette);
      const mesh = new InstancedMesh(geometry, material, capacity);
      mesh.name = typeDefinition.id + "-part-" + partIndex;
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.userData.entityTypeId = typeDefinition.id;
      this.group.add(mesh);
      return {
        geometry,
        material,
        mesh,
        localMatrix: createLocalMatrix(part)
      };
    });

    if (typeDefinition.label.length > 0) {
      this.#labelTexture = createEntityLabelTexture(
        typeDefinition.label,
        visualConfig.accentColorKey,
        { labelConfig, palette, documentRef, canvasFactory }
      );
      this.#labelMaterial = new SpriteMaterial({
        map: this.#labelTexture,
        transparent: true,
        depthWrite: false
      });

      for (let index = 0; index < capacity; index += 1) {
        const sprite = new Sprite(this.#labelMaterial);
        sprite.name = typeDefinition.id + "-label-" + index;
        sprite.scale.set(
          labelConfig.spriteWidth,
          labelConfig.spriteHeight,
          1
        );
        sprite.renderOrder = labelConfig.renderOrder;
        sprite.visible = false;
        sprite.userData.entityLabel = typeDefinition.label;
        this.#labels.push(sprite);
        this.group.add(sprite);
      }
    }
  }

  get capacity() {
    return this.#capacity;
  }

  get count() {
    return this.#parts[0]?.mesh.count ?? 0;
  }

  get partCount() {
    return this.#parts.length;
  }

  get instanceMeshes() {
    return this.#parts.map((part) => part.mesh);
  }

  get labelTexture() {
    return this.#labelTexture;
  }

  sync(entities, track) {
    if (!Array.isArray(entities) || entities.length > this.#capacity) {
      throw new RangeError("Entity batch exceeds its configured capacity.");
    }

    entities.forEach((entity, entityIndex) => {
      const frame = track.getFrameAtDistance(entity.distanceAlongTrack);
      this.#position
        .copy(frame.point)
        .addScaledVector(frame.right, entity.lateralX)
        .addScaledVector(frame.up, entity.lateralY);
      this.#backward.copy(frame.tangent).negate();
      this.#orientationMatrix.makeBasis(
        frame.right,
        frame.up,
        this.#backward
      );
      this.#orientation.setFromRotationMatrix(this.#orientationMatrix);
      this.#spin.setFromAxisAngle(
        LOCAL_Z_AXIS,
        entity.animationPhase +
          entity.animationSeconds *
            this.#visualConfig.spinRadiansPerSecond
      );
      this.#orientation.multiply(this.#spin);

      const pulse =
        1 +
        Math.sin(
          entity.animationPhase +
            entity.animationSeconds *
              this.#visualConfig.pulseFrequencyRadiansPerSecond
        ) *
          this.#visualConfig.pulseAmplitude;
      const visualScale = this.#visualConfig.worldScale * pulse;
      this.#scale.setScalar(visualScale);
      this.#baseMatrix.compose(
        this.#position,
        this.#orientation,
        this.#scale
      );

      this.#parts.forEach((part) => {
        this.#combinedMatrix.multiplyMatrices(
          this.#baseMatrix,
          part.localMatrix
        );
        part.mesh.setMatrixAt(entityIndex, this.#combinedMatrix);
      });

      const label = this.#labels[entityIndex];
      if (label) {
        this.#labelPosition
          .copy(this.#position)
          .addScaledVector(frame.up, this.#labelConfig.offsetY);
        label.position.copy(this.#labelPosition);
        label.visible = true;
        label.userData.entityId = entity.id;
      }
    });

    this.#parts.forEach((part) => {
      part.mesh.count = entities.length;
      part.mesh.instanceMatrix.needsUpdate = true;
    });
    this.#labels.forEach((label, index) => {
      if (index >= entities.length) {
        label.visible = false;
        label.userData.entityId = "";
      }
    });
  }

  dispose() {
    if (this.#disposed) {
      return;
    }

    this.#parts.forEach((part) => {
      part.geometry.dispose();
      part.material.dispose();
    });
    this.#labelMaterial?.dispose();
    this.#labelTexture?.dispose();
    this.group.clear();
    this.#disposed = true;
  }
}

export class ProceduralGasToken {
  #batch;
  #track;
  #entity;
  #visible = false;

  constructor({ batch, track }) {
    if (!batch?.sync || !track?.getFrameAtDistance) {
      throw new TypeError("Gas Token requires a procedural batch and track.");
    }

    this.#batch = batch;
    this.#track = track;
    this.#entity = {
      id: "gas-token",
      distanceAlongTrack: 0,
      lateralX: 0,
      lateralY: 0,
      animationSeconds: 0,
      animationPhase: 0
    };
    this.group = batch.group;
    this.group.name = "procedural-gas-token";
    this.group.userData.gasToken = true;
  }

  get visible() {
    return this.#visible;
  }

  get distanceAlongTrack() {
    return this.#entity.distanceAlongTrack;
  }

  get partCount() {
    return this.#batch.partCount;
  }

  get labelTexture() {
    return this.#batch.labelTexture;
  }

  showAtDistance(distanceAlongTrack) {
    if (!Number.isFinite(distanceAlongTrack)) {
      throw new TypeError("Gas Token distance must be finite.");
    }

    this.#entity.distanceAlongTrack = distanceAlongTrack;
    this.#visible = true;
    this.#sync();
  }

  hide() {
    this.#visible = false;
    this.#sync();
  }

  update(simulationDeltaSeconds) {
    if (
      !Number.isFinite(simulationDeltaSeconds) ||
      simulationDeltaSeconds < 0
    ) {
      throw new RangeError("Gas Token update time must be non-negative.");
    }

    if (!this.#visible) {
      return false;
    }

    this.#entity.animationSeconds += simulationDeltaSeconds;
    this.#sync();
    return true;
  }

  #sync() {
    this.#batch.sync(this.#visible ? [this.#entity] : [], this.#track);
  }
}

export class ProceduralAssetFactory {
  #config;
  #palette;
  #documentRef;
  #canvasFactory;
  #batches = new Set();
  #gasTokens = new Set();

  constructor({
    config = GAME_CONFIG.entityVisuals,
    palette = GAME_CONFIG.palette,
    documentRef = globalThis.document,
    canvasFactory
  } = {}) {
    this.#config = config;
    this.#palette = palette;
    this.#documentRef = documentRef;
    this.#canvasFactory = canvasFactory;
  }

  get batchCount() {
    return this.#batches.size;
  }

  createBatch(typeDefinition, capacity) {
    if (!typeDefinition?.modelKey) {
      throw new TypeError("A configured entity type is required.");
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError("Entity batch capacity must be a positive integer.");
    }

    const visualConfig = this.#config.models[typeDefinition.modelKey];
    if (!visualConfig) {
      throw new RangeError("Missing procedural model: " + typeDefinition.modelKey);
    }

    const batch = new ProceduralEntityBatch({
      typeDefinition,
      visualConfig,
      labelConfig: this.#config.label,
      capacity,
      palette: this.#palette,
      documentRef: this.#documentRef,
      canvasFactory: this.#canvasFactory
    });
    this.#batches.add(batch);
    return batch;
  }

  createGasToken(track) {
    const batch = this.createBatch(this.#config.gasToken, 1);
    const token = new ProceduralGasToken({ batch, track });
    this.#gasTokens.add(token);
    return token;
  }

  dispose() {
    this.#gasTokens.forEach((token) => token.hide());
    this.#gasTokens.clear();
    this.#batches.forEach((batch) => batch.dispose());
    this.#batches.clear();
  }
}
