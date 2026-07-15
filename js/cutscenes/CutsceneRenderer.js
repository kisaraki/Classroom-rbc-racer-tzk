import { GAME_CONFIG } from "../config.js?v=stable-v1.1-20260715-r2";
import { CUTSCENE_TYPES } from "./CutsceneManager.js?v=stable-v1.1-20260715-r2";

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
    kicker: "心臟腔室轉換",
    title: "心房至心室輸送帶",
    copy: "紅血球正隨血流通過心房與心室，任務計時及狀態期限仍持續運行。"
  },
  RECYCLE: {
    kicker: "脾臟與肝臟回收",
    title: "紅血球回收",
    copy: "HP 歸零，紅血球正送往脾臟與肝臟回收廠分解。"
  },
  FALL: {
    kicker: "血管破口",
    title: "翻車墜落",
    copy: "車輛衝出血管破口，黑色剪影翻滾並墜入深淵。"
  },
  STROKE: {
    kicker: "腦部血管事件",
    title: "中風",
    copy: "第三關體循環中的腦部血管破口已造成中風。"
  },
  TIMEOUT: {
    kicker: "任務時間耗盡",
    title: "乾扁血球回收",
    copy: "紅血球未能在時限內抵達終點，已乾扁並送往肝臟工廠回收。"
  },
  VICTORY: {
    kicker: "充氧紅血球遊行",
    title: "四關循環任務完成",
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
    const progressTrack = createElement(
      this.#document,
      "cutscene-progress-track"
    );
    const progress = createElement(this.#document, "cutscene-progress");

    header.append(kicker, title, description);
    progressTrack.append(progress);
    footer.append(progressTrack);
    this.#buildStage(type, stage, context);
    frame.append(header, stage, footer);
    this.#layer.replaceChildren(frame);
    this.#currentType = type;
    this.#elements = { progress };
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
    } else if (type === CUTSCENE_TYPES.TIMEOUT) {
      this.#buildTimeout(stage);
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
      createElement(this.#document, "cutscene-factory__tower", "脾臟"),
      createElement(this.#document, "cutscene-factory__tower", "肝臟")
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
      createElement(this.#document, "cutscene-abyss", "血管破口")
    );
  }

  #buildStroke(stage) {
    stage.classList.add("cutscene-stage--stroke");
    stage.append(
      createElement(this.#document, "cutscene-stroke-flash"),
      createElement(this.#document, "cutscene-stroke-label", "中風")
    );
  }

  #buildTimeout(stage) {
    stage.classList.add("cutscene-stage--timeout");
    const belt = createElement(this.#document, "cutscene-belt");
    belt.append(
      createElement(
        this.#document,
        "cutscene-rbc cutscene-rbc--shriveled",
        "RBC"
      )
    );
    const factory = createElement(
      this.#document,
      "cutscene-factory cutscene-factory--liver"
    );
    factory.append(
      createElement(
        this.#document,
        "cutscene-factory__tower",
        "肝臟工廠"
      )
    );
    const heat = createElement(this.#document, "cutscene-timeout-heat");
    stage.append(belt, factory, heat);
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
