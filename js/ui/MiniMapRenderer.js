import { GAME_CONFIG } from "../config.js?v=phase03-hud-map";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function requireFinitePoint(point, label) {
  if (
    !Array.isArray(point) ||
    point.length !== 2 ||
    !point.every(Number.isFinite)
  ) {
    throw new TypeError(label + " must be a finite [x, y] point.");
  }

  return point;
}

function formatPoint(point, label) {
  const [x, y] = requireFinitePoint(point, label);
  return x + " " + y;
}

function pointsMatch(first, second) {
  return first[0] === second[0] && first[1] === second[1];
}

function createSvgElement(documentRef, name, attributes = {}) {
  const element = documentRef.createElementNS(SVG_NAMESPACE, name);

  Object.entries(attributes).forEach(([attribute, value]) => {
    element.setAttribute(attribute, String(value));
  });

  return element;
}

function requireHost(root) {
  const host = root?.matches?.("#circulation-map")
    ? root
    : root?.querySelector?.("#circulation-map");

  if (!host) {
    throw new Error("Missing minimap element: #circulation-map");
  }

  return host;
}

export function clampMinimapProgress(progress) {
  if (!Number.isFinite(progress)) {
    throw new TypeError("Minimap progress must be a finite number.");
  }

  return Math.min(1, Math.max(0, progress));
}

export function buildVesselPathData(vessel) {
  if (!vessel || typeof vessel !== "object") {
    throw new TypeError("A vessel definition is required.");
  }

  return [
    "M " + formatPoint(vessel.start, vessel.id + " start"),
    "C " + formatPoint(vessel.control1, vessel.id + " control1"),
    formatPoint(vessel.control2, vessel.id + " control2"),
    formatPoint(vessel.end, vessel.id + " end")
  ].join(" ");
}

export function buildRoutePathData(route, vessels) {
  if (!route || !Array.isArray(route.vesselIds) || route.vesselIds.length === 0) {
    throw new TypeError("A route with at least one vessel is required.");
  }

  const vesselsById = new Map(vessels.map((vessel) => [vessel.id, vessel]));
  const routeVessels = route.vesselIds.map((vesselId) => {
    const vessel = vesselsById.get(vesselId);

    if (!vessel) {
      throw new RangeError("Unknown route vessel: " + vesselId);
    }

    return vessel;
  });
  const pathParts = [
    "M " + formatPoint(routeVessels[0].start, route.id + " start")
  ];

  routeVessels.forEach((vessel, index) => {
    if (
      index > 0 &&
      !pointsMatch(routeVessels[index - 1].end, vessel.start)
    ) {
      throw new RangeError("Route vessels must form a continuous SVG path.");
    }

    pathParts.push(
      [
        "C " + formatPoint(vessel.control1, vessel.id + " control1"),
        formatPoint(vessel.control2, vessel.id + " control2"),
        formatPoint(vessel.end, vessel.id + " end")
      ].join(" ")
    );
  });

  return pathParts.join(" ");
}

export function validateMinimapConfig(config = GAME_CONFIG.minimap) {
  if (
    !config ||
    !Number.isFinite(config.viewBoxWidth) ||
    !Number.isFinite(config.viewBoxHeight) ||
    !Array.isArray(config.nodes) ||
    !Array.isArray(config.vessels) ||
    !Array.isArray(config.routes)
  ) {
    throw new TypeError("A complete minimap configuration is required.");
  }

  const nodesById = new Map();
  config.nodes.forEach((node) => {
    if (
      !node?.id ||
      nodesById.has(node.id) ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y)
    ) {
      throw new RangeError("Minimap nodes require unique ids and coordinates.");
    }

    nodesById.set(node.id, node);
  });

  const vesselsById = new Map();
  config.vessels.forEach((vessel) => {
    if (
      !vessel?.id ||
      vesselsById.has(vessel.id) ||
      !nodesById.has(vessel.from) ||
      !nodesById.has(vessel.to)
    ) {
      throw new RangeError("Minimap vessels require unique ids and valid nodes.");
    }

    requireFinitePoint(vessel.start, vessel.id + " start");
    requireFinitePoint(vessel.control1, vessel.id + " control1");
    requireFinitePoint(vessel.control2, vessel.id + " control2");
    requireFinitePoint(vessel.end, vessel.id + " end");

    const startNode = nodesById.get(vessel.from);
    const endNode = nodesById.get(vessel.to);

    if (
      !pointsMatch(vessel.start, [startNode.x, startNode.y]) ||
      !pointsMatch(vessel.end, [endNode.x, endNode.y])
    ) {
      throw new RangeError("Vessel endpoints must match their configured nodes.");
    }

    vesselsById.set(vessel.id, vessel);
  });

  const routeIds = new Set();
  config.routes.forEach((route) => {
    if (!route?.id || routeIds.has(route.id)) {
      throw new RangeError("Minimap routes require unique ids.");
    }

    buildRoutePathData(route, config.vessels);
    routeIds.add(route.id);
  });

  return true;
}

export function calculateMarkerPoint(pathElement, progress) {
  if (
    typeof pathElement?.getTotalLength !== "function" ||
    typeof pathElement?.getPointAtLength !== "function"
  ) {
    throw new TypeError("Marker movement requires an SVG path geometry element.");
  }

  const clampedProgress = clampMinimapProgress(progress);
  const totalLength = pathElement.getTotalLength();

  if (!Number.isFinite(totalLength) || totalLength <= 0) {
    throw new RangeError("The active SVG path must have a positive length.");
  }

  const point = pathElement.getPointAtLength(totalLength * clampedProgress);

  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
    throw new TypeError("The active SVG path returned an invalid point.");
  }

  return { x: point.x, y: point.y, progress: clampedProgress };
}

export class MiniMapRenderer {
  #host;
  #config;
  #routePaths = new Map();
  #vesselPaths = new Map();
  #marker;
  #currentRouteId = "";
  #progress = 0;

  constructor(root = globalThis.document, config = GAME_CONFIG.minimap) {
    validateMinimapConfig(config);

    this.#host = requireHost(root);
    this.#config = config;
    this.#build(this.#host.ownerDocument);
  }

  get nodeCount() {
    return this.#config.nodes.length;
  }

  get vesselCount() {
    return this.#config.vessels.length;
  }

  get currentRouteId() {
    return this.#currentRouteId;
  }

  get progress() {
    return this.#progress;
  }

  update(routeId, progress) {
    if (routeId !== this.#currentRouteId) {
      this.#activateRoute(routeId);
    }

    const path = this.#routePaths.get(routeId);

    if (!path) {
      throw new RangeError("Unknown minimap route: " + routeId);
    }

    const point = calculateMarkerPoint(path, progress);
    const precision = this.#config.playerMarker.coordinatePrecision;

    this.#marker.setAttribute(
      "transform",
      "translate(" +
        point.x.toFixed(precision) +
        " " +
        point.y.toFixed(precision) +
        ")"
    );
    this.#progress = point.progress;
    this.#host.dataset.routeId = routeId;
    this.#host.dataset.progress = point.progress.toFixed(
      GAME_CONFIG.hud.minimapProgressPrecision
    );
    this.#host.dataset.markerX = point.x.toFixed(precision);
    this.#host.dataset.markerY = point.y.toFixed(precision);
  }

  #build(documentRef) {
    const config = this.#config;
    const svg = createSvgElement(documentRef, "svg", {
      class: "circulation-map__svg",
      viewBox: "0 0 " + config.viewBoxWidth + " " + config.viewBoxHeight,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "七節點血液循環圖，玩家位置沿第一關路徑連續移動"
    });
    const vesselLayer = createSvgElement(documentRef, "g", {
      class: "circulation-map__vessels",
      "aria-hidden": "true"
    });
    const routeLayer = createSvgElement(documentRef, "g", {
      class: "circulation-map__routes",
      "aria-hidden": "true"
    });
    const nodeLayer = createSvgElement(documentRef, "g", {
      class: "circulation-map__nodes"
    });

    svg.style.setProperty(
      "--minimap-pulse-duration",
      config.playerMarker.pulseDurationSeconds + "s"
    );

    config.vessels.forEach((vessel) => {
      const path = createSvgElement(documentRef, "path", {
        class: "circulation-vessel",
        d: buildVesselPathData(vessel),
        fill: "none",
        stroke: GAME_CONFIG.palette[vessel.colorKey],
        "stroke-width": config.vesselStrokeWidth,
        "vector-effect": "non-scaling-stroke",
        "data-vessel-id": vessel.id,
        "data-from": vessel.from,
        "data-to": vessel.to
      });

      this.#vesselPaths.set(vessel.id, path);
      vesselLayer.append(path);
    });

    config.routes.forEach((route) => {
      const path = createSvgElement(documentRef, "path", {
        id: route.id,
        class: "circulation-route-path",
        d: buildRoutePathData(route, config.vessels),
        fill: "none",
        stroke: "transparent",
        "stroke-width": config.routeStrokeWidth,
        "data-route-id": route.id,
        "data-route-label": route.label
      });

      this.#routePaths.set(route.id, path);
      routeLayer.append(path);
    });

    config.nodes.forEach((node) => {
      nodeLayer.append(this.#createNode(documentRef, node));
    });

    this.#marker = createSvgElement(documentRef, "g", {
      class: "minimap-player-marker",
      "data-player-marker": "true",
      "aria-label": "玩家目前位置"
    });
    this.#marker.append(
      createSvgElement(documentRef, "circle", {
        class: "minimap-player-marker__halo",
        r: config.playerMarker.haloRadius,
        fill: GAME_CONFIG.palette.hudGlow
      }),
      createSvgElement(documentRef, "circle", {
        class: "minimap-player-marker__core",
        r: config.playerMarker.coreRadius,
        fill: GAME_CONFIG.palette.hudGlow
      })
    );

    svg.append(vesselLayer, routeLayer, nodeLayer, this.#marker);
    this.#host.replaceChildren(svg);
    this.#host.dataset.nodeCount = String(config.nodes.length);
    this.#host.dataset.vesselCount = String(config.vessels.length);
  }

  #createNode(documentRef, node) {
    const group = createSvgElement(documentRef, "g", {
      class: "circulation-node circulation-node--" + node.shape,
      "data-node-id": node.id,
      role: "group",
      "aria-label": node.label
    });
    const shape =
      node.shape === "circle"
        ? createSvgElement(documentRef, "circle", {
            cx: node.x,
            cy: node.y,
            r: node.radius
          })
        : createSvgElement(documentRef, "rect", {
            x: node.x - node.width / 2,
            y: node.y - node.height / 2,
            width: node.width,
            height: node.height,
            rx: node.cornerRadius
          });
    const label = createSvgElement(documentRef, "text", {
      x: node.labelX,
      y: node.labelY,
      "text-anchor": node.labelAnchor,
      "font-size": this.#config.nodeLabelFontSize
    });
    const color = GAME_CONFIG.palette[node.colorKey];

    if (!color) {
      throw new RangeError("Unknown minimap palette key: " + node.colorKey);
    }

    shape.setAttribute("fill", color);
    shape.setAttribute("fill-opacity", this.#config.nodeFillOpacity);
    shape.setAttribute("stroke", color);
    shape.setAttribute("stroke-width", this.#config.nodeStrokeWidth);
    shape.setAttribute("vector-effect", "non-scaling-stroke");
    label.textContent = node.label;
    group.append(shape, label);

    return group;
  }

  #activateRoute(routeId) {
    const route = this.#config.routes.find((candidate) => candidate.id === routeId);

    if (!route) {
      throw new RangeError("Unknown minimap route: " + routeId);
    }

    this.#vesselPaths.forEach((path) => {
      path.dataset.activeRoute = "false";
      path.setAttribute("stroke-width", this.#config.vesselStrokeWidth);
    });
    route.vesselIds.forEach((vesselId) => {
      const path = this.#vesselPaths.get(vesselId);
      path.dataset.activeRoute = "true";
      path.setAttribute("stroke-width", this.#config.activeVesselStrokeWidth);
    });
    this.#currentRouteId = routeId;
  }
}
