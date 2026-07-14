import {
  BackSide,
  Curve,
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
    getFrameAtRatio
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
    const radialDirection = new Vector3();
    let vertexIndex = 0;

    for (
      let tubularIndex = 0;
      tubularIndex <= tubularSegments;
      tubularIndex += 1
    ) {
      const sectionRatio = tubularIndex / tubularSegments;
      const curveRatio =
        startRatio + (endRatio - startRatio) * sectionRatio;
      const frame = getFrameAtRatio(curveRatio);

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
        vertexIndex += 1;
      }
    }

    position.needsUpdate = true;
    normal.needsUpdate = true;
    this.computeBoundingBox();
    this.computeBoundingSphere();
  }
}

export class TrackSection {
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
    color,
    emissiveColor,
    flowTexture,
    getFrameAtRatio
  }) {
    this.id = definition.id;
    this.startRatio = definition.startRatio;
    this.endRatio = definition.endRatio;
    this.radius = definition.radius;

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
      getFrameAtRatio
    });
    this.material = new MeshStandardMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity: materialConfig.emissiveIntensity,
      roughness: materialConfig.roughness,
      metalness: materialConfig.metalness,
      map: flowTexture,
      side: BackSide
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.name = "prototype-track-section-" + this.id;
    this.mesh.userData.trackSectionId = this.id;
    this.mesh.userData.radius = this.radius;
    this.mesh.userData.usesParallelTransportFrames = true;
  }

  containsRatio(ratio) {
    return (
      ratio >= this.startRatio &&
      (ratio < this.endRatio || this.endRatio === 1)
    );
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
