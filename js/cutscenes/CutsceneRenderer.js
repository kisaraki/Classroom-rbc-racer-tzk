import { GAME_CONFIG } from "../config.js?v=phase09-endings-r1";
import { CUTSCENE_TYPES } from "./CutsceneManager.js?v=phase09-endings-r1";

function requireElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error("Missing cutscene element: " + selector);
  }

  return element;
}

function createElement(documentRef, className, text = "") {
  const element = documentRef.createElement("div");
  element.className = className;
  element.textContent = text;
  return element;
}

const CUTSCENE_COPY = Object.freeze({
  TRANSFER: {
    kicker: "HEART CHAMBER TRANSFER",
    title: "心腔輸送帶",
    copy: "血流以絕對時間通過心房至心室，REAL CLOCK 與狀態期限持續運行。"
  },
  RECYCLE: {
    kicker: "SPLEEN / LIVER RECOVERY",
    title: "紅血球回收",
    copy: "HP 歸零，紅血球正送往脾臟與肝臟回收廠分解。"
  },
  FALL: {
    kicker: "VESSEL RUPTURE",
    title: "翻車墜落",
    copy: "車輛衝出血管破口，黑色剪影翻滾並墜入深淵。"
  },
  STROKE: {
    kicker: "CEREBRAL VESSEL EVENT",
    title: "中風 / STROKE",
    copy: "第三關腦循環 Wound 已觸發專屬中風結局。"
  },
  VICTORY: {
    kicker: "OXYGEN PARADE",
    title: "四循環完成",
    copy: "紅血球車隊進入鮮紅血管，揮舞 O₂ 旗幟完成勝利遊街。"
  }
});

export class CutsceneRenderer {
  #document;
  #layer;
  #currentType = null;
  #elements = null;

  constructor(root = document) {
    this.#document = root.ownerDocument ?? root;
    this.#layer = requireElement(root, "#cutscene-layer");
  }

  get isVisible() {
    return !this.#layer.hidden;
  }

  get type() {
    return this.#currentType;
  }

  render(snapshot) {
    if (!snapshot?.active) {
      this.hide();
      return;
    }

    if (snapshot.type !== this.#currentType) {
      this.#build(snapshot.type, snapshot.context);
    }

    this.#layer.hidden = false;
    this.#layer.dataset.type = snapshot.type;
    this.#layer.dataset.phase = snapshot.phase;
    this.#layer.dataset.completed = String(snapshot.completed);
    this.#layer.style.setProperty(
      "--cutscene-duration",
      snapshot.durationSeconds + "s"
    );
    this.#elements.progress.style.width = snapshot.progress * 100 + "%";
    this.#elements.phase.textContent = snapshot.phase.replaceAll("_", " ");
  }

  hide() {
    this.#layer.hidden = true;
    this.#layer.dataset.type = "";
    this.#layer.dataset.phase = "";
    this.#layer.dataset.completed = "false";
    this.#layer.replaceChildren();
    this.#currentType = null;
    this.#elements = null;
  }

  #build(type, context) {
    const copy = CUTSCENE_COPY[type];
    const frame = createElement(this.#document, "cutscene-frame");
    const header = createElement(this.#document, "cutscene-header");
    const kicker = createElement(
      this.#document,
      "cutscene-kicker",
      copy.kicker
    );
    const title = this.#document.createElement("h2");
    title.className = "cutscene-title";
    title.textContent = copy.title;
    const description = this.#document.createElement("p");
    description.className = "cutscene-copy";
    description.textContent = copy.copy;
    const stage = createElement(this.#document, "cutscene-stage");
    const footer = createElement(this.#document, "cutscene-footer");
    const phase = createElement(this.#document, "cutscene-phase");
    const progressTrack = createElement(
      this.#document,
      "cutscene-progress-track"
    );
    const progress = createElement(this.#document, "cutscene-progress");

    header.append(kicker, title, description);
    progressTrack.append(progress);
    footer.append(phase, progressTrack);
    this.#buildStage(type, stage, context);
    frame.append(header, stage, footer);
    this.#layer.replaceChildren(frame);
    this.#currentType = type;
    this.#elements = { phase, progress };
  }

  #buildStage(type, stage, context) {
    if (type === CUTSCENE_TYPES.TRANSFER) {
      this.#buildTransfer(stage, context);
    } else if (type === CUTSCENE_TYPES.RECYCLE) {
      this.#buildRecycle(stage);
    } else if (type === CUTSCENE_TYPES.FALL) {
      this.#buildFall(stage);
    } else if (type === CUTSCENE_TYPES.STROKE) {
      this.#buildStroke(stage);
    } else if (type === CUTSCENE_TYPES.VICTORY) {
      this.#buildVictory(stage);
    }
  }

  #buildTransfer(stage, context) {
    stage.classList.add("cutscene-stage--transfer");
    const from = createElement(
      this.#document,
      "cutscene-chamber cutscene-chamber--from",
      context.fromChamber ?? "心房"
    );
    const to = createElement(
      this.#document,
      "cutscene-chamber cutscene-chamber--to",
      context.toChamber ?? "心室"
    );
    const belt = createElement(this.#document, "cutscene-belt");
    const rbc = createElement(this.#document, "cutscene-rbc", "RBC");
    belt.append(rbc);
    stage.append(from, belt, to);
  }

  #buildRecycle(stage) {
    stage.classList.add("cutscene-stage--recycle");
    const belt = createElement(this.#document, "cutscene-belt");
    belt.append(createElement(this.#document, "cutscene-rbc", "RBC"));
    const factory = createElement(this.#document, "cutscene-factory");
    factory.append(
      createElement(this.#document, "cutscene-factory__tower", "SPLEEN"),
      createElement(this.#document, "cutscene-factory__tower", "LIVER")
    );
    const fragments = createElement(this.#document, "cutscene-fragments");
    for (
      let index = 0;
      index < GAME_CONFIG.cutscenes.recycleFragmentCount;
      index += 1
    ) {
      const fragment = createElement(this.#document, "cutscene-fragment");
      fragment.style.setProperty("--item-index", String(index));
      fragment.style.setProperty(
        "--item-column",
        String(index % GAME_CONFIG.cutscenes.recycleFragmentColumns)
      );
      fragments.append(fragment);
    }
    stage.append(belt, factory, fragments);
  }

  #buildFall(stage) {
    stage.classList.add("cutscene-stage--fall");
    stage.append(
      createElement(this.#document, "cutscene-vessel-rim"),
      createElement(this.#document, "cutscene-rbc cutscene-rbc--fall", "RBC"),
      createElement(this.#document, "cutscene-abyss", "VESSEL RUPTURE")
    );
  }

  #buildStroke(stage) {
    stage.classList.add("cutscene-stage--stroke");
    stage.append(
      createElement(this.#document, "cutscene-stroke-flash"),
      createElement(this.#document, "cutscene-stroke-label", "中風"),
      createElement(this.#document, "cutscene-stroke-subtitle", "STROKE")
    );
  }

  #buildVictory(stage) {
    stage.classList.add("cutscene-stage--victory");
    const vessel = createElement(this.#document, "cutscene-victory-vessel");
    const parade = createElement(this.#document, "cutscene-parade");
    for (
      let index = 0;
      index < GAME_CONFIG.cutscenes.victoryParadeRbcCount;
      index += 1
    ) {
      const rbc = createElement(
        this.#document,
        "cutscene-rbc cutscene-rbc--parade",
        index === 0 ? "RBC  O₂" : "RBC"
      );
      rbc.style.setProperty("--item-index", String(index));
      rbc.style.setProperty(
        "--item-row",
        String(index % GAME_CONFIG.cutscenes.victoryParadeRows)
      );
      parade.append(rbc);
    }
    const flag = createElement(this.#document, "cutscene-oxygen-flag", "O₂");
    const confetti = createElement(this.#document, "cutscene-confetti");
    for (
      let index = 0;
      index < GAME_CONFIG.cutscenes.victoryConfettiCount;
      index += 1
    ) {
      const strip = createElement(this.#document, "cutscene-confetti__strip");
      strip.style.setProperty("--item-index", String(index));
      strip.style.setProperty(
        "--item-row",
        String(index % GAME_CONFIG.cutscenes.victoryConfettiRows)
      );
      strip.style.setProperty(
        "--item-column",
        String(index % GAME_CONFIG.cutscenes.victoryConfettiColumns)
      );
      confetti.append(strip);
    }
    stage.append(vessel, parade, flag, confetti);
  }
}
