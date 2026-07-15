import { GAME_CONFIG } from "../../js/config.js?v=stable-v1.1-20260715-r2";
import { LEVELS } from "../../js/data/levels.js?v=stable-v1.1-20260715-r2";
import {
  buildHeartOutlinePathData,
  buildRoutePathData,
  buildVesselPathData,
  calculateMarkerPoint,
  clampMinimapProgress,
  resolveMarkerPoint,
  validateMinimapConfig
} from "../../js/ui/MiniMapRenderer.js?v=stable-v1.1-20260715-r2";
import {
  assert,
  assertApproximately,
  assertDeepEqual,
  assertEqual,
  assertThrows
} from "./TestHarness.js";

export function registerMinimapTests(harness) {
  harness.test("minimap config defines the seven required circulation nodes", () => {
    const nodeIds = GAME_CONFIG.minimap.nodes
      .map((node) => node.id)
      .sort();

    assertDeepEqual(nodeIds, [
      "brain",
      "left-atrium",
      "left-ventricle",
      "lungs",
      "right-atrium",
      "right-ventricle",
      "tissues"
    ]);
  });

  harness.test("all eight minimap vessels connect configured nodes", () => {
    const nodeIds = new Set(GAME_CONFIG.minimap.nodes.map((node) => node.id));

    assertEqual(GAME_CONFIG.minimap.vessels.length, 8);
    assert(
      GAME_CONFIG.minimap.vessels.every(
        (vessel) => nodeIds.has(vessel.from) && nodeIds.has(vessel.to)
      )
    );
    assertEqual(validateMinimapConfig(), true);
  });

  harness.test("heart chambers preserve orientation in a compact group", () => {
    const chambers = new Map(
      GAME_CONFIG.minimap.nodes
        .filter((node) =>
          GAME_CONFIG.minimap.heartOutline.chamberNodeIds.includes(node.id)
        )
        .map((node) => [node.id, node])
    );
    const rightAtrium = chambers.get("right-atrium");
    const rightVentricle = chambers.get("right-ventricle");
    const leftAtrium = chambers.get("left-atrium");
    const leftVentricle = chambers.get("left-ventricle");
    const chamberNodes = [...chambers.values()];
    const horizontalSpan =
      Math.max(...chamberNodes.map((node) => node.x)) -
      Math.min(...chamberNodes.map((node) => node.x));
    const verticalSpan =
      Math.max(...chamberNodes.map((node) => node.y)) -
      Math.min(...chamberNodes.map((node) => node.y));

    assertEqual(chambers.size, 4);
    assert(rightAtrium.x < leftAtrium.x);
    assert(rightVentricle.x < leftVentricle.x);
    assert(rightAtrium.y < rightVentricle.y);
    assert(leftAtrium.y < leftVentricle.y);
    assert(horizontalSpan <= 48);
    assert(verticalSpan <= 36);
  });

  harness.test("heart outline closes around the four chambers", () => {
    const outline = GAME_CONFIG.minimap.heartOutline;
    const pathData = buildHeartOutlinePathData(outline);

    assertEqual(outline.chamberNodeIds.length, 4);
    assertEqual((pathData.match(/\bM\b/g) ?? []).length, 1);
    assertEqual((pathData.match(/\bC\b/g) ?? []).length, 6);
    assert(pathData.startsWith("M 181 232"));
    assert(pathData.endsWith("Z"));
  });

  harness.test("all four levels select their configured circulation route", () => {
    const routesById = new Map(
      GAME_CONFIG.minimap.routes.map((route) => [route.id, route])
    );
    const expectedVessels = {
      "systemic-lower-circulation-path": [
        "left-ventricle-to-tissues",
        "tissues-to-right-atrium",
        "right-atrium-to-right-ventricle"
      ],
      "pulmonary-circulation-path": [
        "right-ventricle-to-lungs",
        "lungs-to-left-atrium",
        "left-atrium-to-left-ventricle"
      ],
      "systemic-upper-circulation-path": [
        "left-ventricle-to-brain",
        "brain-to-right-atrium",
        "right-atrium-to-right-ventricle"
      ],
      "high-risk-pulmonary-circulation-path": [
        "right-ventricle-to-lungs",
        "lungs-to-left-atrium",
        "left-atrium-to-left-ventricle"
      ]
    };

    assertEqual(routesById.size, GAME_CONFIG.game.totalLevelCount);
    LEVELS.forEach((level) => {
      assert(routesById.has(level.minimapPathId));
      assertDeepEqual(
        routesById.get(level.minimapPathId).vesselIds,
        expectedVessels[level.minimapPathId]
      );
    });
  });

  harness.test("configured vessel curves generate cubic SVG path data", () => {
    const pathData = buildVesselPathData(GAME_CONFIG.minimap.vessels[0]);

    assert(pathData.startsWith("M 195 207 C 294 187"));
    assert(pathData.endsWith("180 34"));
  });

  harness.test("lower systemic route is one continuous multi-curve SVG path", () => {
    const pathData = buildRoutePathData(
      GAME_CONFIG.minimap.routes[0],
      GAME_CONFIG.minimap.vessels
    );

    assertEqual((pathData.match(/\bM\b/g) ?? []).length, 1);
    assertEqual((pathData.match(/\bC\b/g) ?? []).length, 3);
    assert(pathData.startsWith("M 195 207"));
    assert(pathData.endsWith("169 207"));
  });

  harness.test("every Phase 09 minimap route builds one continuous SVG path", () => {
    GAME_CONFIG.minimap.routes.forEach((route) => {
      const pathData = buildRoutePathData(route, GAME_CONFIG.minimap.vessels);

      assertEqual((pathData.match(/\bM\b/g) ?? []).length, 1);
      assertEqual(
        (pathData.match(/\bC\b/g) ?? []).length,
        route.vesselIds.length
      );
    });
  });

  harness.test("minimap progress clamps to the SVG path bounds", () => {
    assertEqual(clampMinimapProgress(-0.5), 0);
    assertEqual(clampMinimapProgress(0.625), 0.625);
    assertEqual(clampMinimapProgress(1.5), 1);
    assertThrows(() => clampMinimapProgress(Number.NaN), TypeError);
  });

  harness.test("player marker samples intermediate SVG path positions", () => {
    let sampledDistance = 0;
    const path = {
      getTotalLength: () => 240,
      getPointAtLength: (distance) => {
        sampledDistance = distance;
        return { x: distance, y: distance / 2 };
      }
    };
    const point = calculateMarkerPoint(path, 0.25);

    assertEqual(sampledDistance, 60);
    assertDeepEqual(point, { x: 60, y: 30, progress: 0.25 });
  });

  harness.test("player marker reaches both SVG path endpoints", () => {
    const path = {
      getTotalLength: () => 100,
      getPointAtLength: (distance) => ({ x: distance, y: 100 - distance })
    };

    assertDeepEqual(calculateMarkerPoint(path, -1), {
      x: 0,
      y: 100,
      progress: 0
    });
    assertDeepEqual(calculateMarkerPoint(path, 2), {
      x: 100,
      y: 0,
      progress: 1
    });
  });

  harness.test("gas exchange anchors the marker to the teaching node", () => {
    const path = {
      getTotalLength: () => 100,
      getPointAtLength: () => ({ x: 1, y: 2 })
    };
    const lungs = GAME_CONFIG.minimap.nodes.find(
      (node) => node.id === "lungs"
    );
    const point = resolveMarkerPoint(path, 0.42, "lungs");

    assertDeepEqual(point, {
      x: lungs.x,
      y: lungs.y,
      progress: 0.42,
      anchorNodeId: "lungs"
    });
    assertThrows(
      () => resolveMarkerPoint(path, 0.5, "unknown-node"),
      RangeError
    );
  });

  harness.test("route construction rejects disconnected vessel curves", () => {
    const route = GAME_CONFIG.minimap.routes[0];
    const vessels = GAME_CONFIG.minimap.vessels.map((vessel) => ({ ...vessel }));
    const secondIndex = vessels.findIndex(
      (vessel) => vessel.id === route.vesselIds[1]
    );
    vessels[secondIndex] = { ...vessels[secondIndex], start: [181, 270] };

    assertThrows(() => buildRoutePathData(route, vessels), RangeError);
  });

  harness.test("marker path sampling preserves fractional progress", () => {
    const path = {
      getTotalLength: () => 300,
      getPointAtLength: (distance) => ({ x: distance / 3, y: distance / 6 })
    };
    const point = calculateMarkerPoint(path, 1 / 3);

    assertApproximately(point.x, 100 / 3, Number.EPSILON);
    assertApproximately(point.progress, 1 / 3, Number.EPSILON);
  });
}
