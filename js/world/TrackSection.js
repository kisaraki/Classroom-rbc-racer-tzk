import {
  BackSide,
  Color,
  Curve,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3
} from "../../vendor/three.module.js";

class CurveWindow extends Curve {
  constructor(curve, startRatio, endRatio) {
    super();
    this.curve = curve;
    this.startRatio = startRatio;
    this.endRatio = endRatio;
  }

  getPoint(t, target = new Vector3()) {
    const curveRatio =
      this.startRatio + (this.endRatio - this.startRatio) * t;
    return target.copy(this.curve.getPointAt(curveRatio));
  }
}

export class ParallelTransportTubeGeometry extends TubeGeometry {
  constructor({
    curve,
    startRatio,
    endRatio,
    tubularSegments,
    radius,
    radialSegments,
    getFrameAtRatio,
    logicalStartRatio,
    logicalEndRatio,
    colorStart,
    colorEnd
  }) {
    const curveWindow = new CurveWindow(curve, startRatio, endRatio);
    super(
      curveWindow,
      tubularSegments,
      radius,
      radialSegments,
      false
    );

    const position = this.getAttribute("position");
    const normal = this.getAttribute("normal");
    const colors = new Float32Array(position.count * 3);
    const colorProgresses = new Float32Array(position.count);
    const startColor = new Color(colorStart);
    const endColor = new Color(colorEnd);
    const vertexColor = new Color();
    const radialDirection = new Vector3();
    let vertexIndex = 0;
    let colorIndex = 0;

    for (
      let tubularIndex = 0;
      tubularIndex <= tubularSegments;
      tubularIndex += 1
    ) {
      const sectionRatio = tubularIndex / tubularSegments;
      const curveRatio =
        startRatio + (endRatio - startRatio) * sectionRatio;
      const frame = getFrameAtRatio(curveRatio);
      const colorProgress = Math.min(
        1,
        Math.max(
          0,
          (curveRatio - logicalStartRatio) /
            (logicalEndRatio - logicalStartRatio)
        )
      );
      vertexColor.copy(startColor).lerp(endColor, colorProgress);

      for (
        let radialIndex = 0;
        radialIndex <= radialSegments;
        radialIndex += 1
      ) {
        const angle =
          (radialIndex / radialSegments) * Math.PI * 2;
        radialDirection
          .copy(frame.right)
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(frame.up, Math.sin(angle))
          .normalize();

        position.setXYZ(
          vertexIndex,
          frame.point.x + radius * radialDirection.x,
          frame.point.y + radius * radialDirection.y,
          frame.point.z + radius * radialDirection.z
        );
        normal.setXYZ(
          vertexIndex,
          radialDirection.x,
          radialDirection.y,
          radialDirection.z
        );
        colors[colorIndex] = vertexColor.r;
        colors[colorIndex + 1] = vertexColor.g;
        colors[colorIndex + 2] = vertexColor.b;
        colorProgresses[vertexIndex] = colorProgress;
        vertexIndex += 1;
        colorIndex += 3;
      }
    }

    this.setAttribute("color", new Float32BufferAttribute(colors, 3));
    this.colorProgresses = colorProgresses;
    position.needsUpdate = true;
    normal.needsUpdate = true;
    this.computeBoundingBox();
    this.computeBoundingSphere();
  }

  setColorGradient(colorStart, colorEnd) {
    const startColor = new Color(colorStart);
    const endColor = new Color(colorEnd);
    const vertexColor = new Color();
    const colors = this.getAttribute("color");

    for (let index = 0; index < colors.count; index += 1) {
      vertexColor
        .copy(startColor)
        .lerp(endColor, this.colorProgresses[index]);
      colors.setXYZ(index, vertexColor.r, vertexColor.g, vertexColor.b);
    }

    colors.needsUpdate = true;
  }
}

export class TrackSection {
  #startColorValue;
  #endColorValue;
  #initialStartColorValue;
  #initialEndColorValue;

  constructor({
    definition,
    curve,
    trackLength,
    renderStartRatio,
    renderEndRatio,
    radialSegments,
    tubularSegmentsPerWorldUnit,
    minimumTubularSegments,
    materialConfig,
    emissiveColor,
    flowTexture,
    getFrameAtRatio,
    colorStart,
    colorEnd
  }) {
    this.id = definition.id;
    this.locationLabel = definition.locationLabel;
    this.startDistance = definition.startDistance;
    this.endDistance = definition.endDistance;
    this.startRatio = definition.startRatio;
    this.endRatio = definition.endRatio;
    this.radius = definition.radius;
    this.colorStart = colorStart;
    this.colorEnd = colorEnd;
    this.#startColorValue = new Color(colorStart);
    this.#endColorValue = new Color(colorEnd);
    this.#initialStartColorValue = new Color(colorStart);
    this.#initialEndColorValue = new Color(colorEnd);
    this.displayColorStart = colorStart;
    this.displayColorEnd = colorEnd;
    this.gasExchangeZone = definition.gasExchangeZone ?? null;
    this.minimapSegmentId = definition.minimapSegmentId;
    this.minimapStartProgress = definition.minimapStartProgress;
    this.minimapEndProgress = definition.minimapEndProgress;

    const sectionWorldLength =
      (renderEndRatio - renderStartRatio) * trackLength;
    const tubularSegments = Math.max(
      minimumTubularSegments,
      Math.ceil(sectionWorldLength * tubularSegmentsPerWorldUnit)
    );

    this.geometry = new ParallelTransportTubeGeometry({
      curve,
      startRatio: renderStartRatio,
      endRatio: renderEndRatio,
      tubularSegments,
      radius: this.radius,
      radialSegments,
      getFrameAtRatio,
      logicalStartRatio: definition.startRatio,
      logicalEndRatio: definition.endRatio,
      colorStart,
      colorEnd
    });
    this.material = new MeshStandardMaterial({
      emissive: emissiveColor,
      emissiveIntensity: materialConfig.emissiveIntensity,
      roughness: materialConfig.roughness,
      metalness: materialConfig.metalness,
      map: flowTexture,
      vertexColors: true,
      side: BackSide
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.name = "level-track-section-" + this.id;
    this.mesh.userData.trackSectionId = this.id;
    this.mesh.userData.locationLabel = this.locationLabel;
    this.mesh.userData.startDistance = this.startDistance;
    this.mesh.userData.endDistance = this.endDistance;
    this.mesh.userData.radius = this.radius;
    this.mesh.userData.usesParallelTransportFrames = true;
  }

  containsRatio(ratio) {
    return (
      ratio >= this.startRatio &&
      (ratio < this.endRatio || this.endRatio === 1)
    );
  }

  containsDistance(distanceAlongTrack) {
    return (
      distanceAlongTrack >= this.startDistance &&
      (distanceAlongTrack < this.endDistance || this.endRatio === 1)
    );
  }

  getColorAtDistance(distanceAlongTrack, target = new Color()) {
    if (!Number.isFinite(distanceAlongTrack) || !target?.isColor) {
      throw new TypeError(
        "Track color sampling requires a finite distance and Color target."
      );
    }

    const clampedDistance = Math.min(
      this.endDistance,
      Math.max(this.startDistance, distanceAlongTrack)
    );
    const progress =
      (clampedDistance - this.startDistance) /
      (this.endDistance - this.startDistance);

    return target
      .copy(this.#startColorValue)
      .lerp(this.#endColorValue, progress);
  }

  get initialColorStart() {
    return "#" + this.#initialStartColorValue.getHexString();
  }

  setDisplayColors(colorStart, colorEnd) {
    this.#startColorValue.set(colorStart);
    this.#endColorValue.set(colorEnd);
    this.displayColorStart = "#" + this.#startColorValue.getHexString();
    this.displayColorEnd = "#" + this.#endColorValue.getHexString();
    this.geometry.setColorGradient(
      this.#startColorValue,
      this.#endColorValue
    );
  }

  resetDisplayColors() {
    this.setDisplayColors(
      this.#initialStartColorValue,
      this.#initialEndColorValue
    );
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
