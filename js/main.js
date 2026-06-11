/* ==========================================================================
   Minkyo Kim — Portfolio
   GSAP: ScrollSmoother (weighty scroll), conveyor belt, 3D photo ring,
   draggable rowing boat with proximity-faded story cards.
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Draggable, InertiaPlugin);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   1. Heavy, momentum-based scrolling.
   `smooth` is the catch-up time in seconds: a higher value makes the page
   feel heavier and glide to a gradual stop after the user stops scrolling.
   -------------------------------------------------------------------------- */
ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth: reduceMotion ? 0 : 2.4,
  smoothTouch: reduceMotion ? 0 : 0.9,
  effects: true,
});

/* --------------------------------------------------------------------------
   2. Hero entrance + generic scroll reveals
   -------------------------------------------------------------------------- */
gsap.timeline({ defaults: { ease: "power3.out" } })
  .from(".hero-line > span", { yPercent: 110, duration: 1.2, stagger: 0.15 })
  .from(".hero-portrait", { autoAlpha: 0, scale: 0.92, duration: 1.1 }, "-=0.7")
  .from(".scroll-cue", { autoAlpha: 0, duration: 0.8 }, "-=0.4");

gsap.utils.toArray("[data-reveal]").forEach((el) => {
  gsap.from(el, {
    autoAlpha: 0,
    y: reduceMotion ? 0 : 44,
    duration: 1,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 86%" },
  });
});

/* --------------------------------------------------------------------------
   3. K-Environmentalism — conveyor belt moving right.
   The track holds two identical sets; animating from -50% to 0 loops
   seamlessly while drifting rightward.
   -------------------------------------------------------------------------- */
const beltTween = gsap.fromTo(
  ".belt-track",
  { xPercent: -50 },
  { xPercent: 0, duration: 30, ease: "none", repeat: -1 }
);

if (reduceMotion) beltTween.pause();

const belt = document.querySelector(".belt");
belt.addEventListener("mouseenter", () => gsap.to(beltTween, { timeScale: 0.15, duration: 0.6 }));
belt.addEventListener("mouseleave", () => gsap.to(beltTween, { timeScale: 1, duration: 0.6 }));

/* Belt reacts to scroll velocity for extra liveliness */
if (!reduceMotion) {
  ScrollTrigger.create({
    trigger: ".belt",
    start: "top bottom",
    end: "bottom top",
    onUpdate(self) {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 2.5);
      gsap.to(beltTween, { timeScale: boost, duration: 0.4, overwrite: "auto" });
    },
  });
}

/* --------------------------------------------------------------------------
   4. Photojournalism — 3D ring of 6 cards.
   Drag (mouse) or swipe (touch) to spin; the slider scrubs and stays in sync.
   -------------------------------------------------------------------------- */
const ring = document.querySelector(".ring");
const ringCards = gsap.utils.toArray(".ring-card");
const ringSlider = document.getElementById("ring-slider");
const CARD_ANGLE = 360 / ringCards.length;

let ringRotation = 0;

function ringRadius() {
  const w = ringCards[0].offsetWidth;
  return Math.round(w / 2 / Math.tan(Math.PI / ringCards.length)) + 30;
}

function layoutRing() {
  const r = ringRadius();
  const origin = `50% 50% ${-r}px`;
  gsap.set(ring, { transformOrigin: origin, rotationY: ringRotation });
  ringCards.forEach((card, i) => {
    gsap.set(card, { transformOrigin: origin, rotationY: i * CARD_ANGLE });
  });
  shadeRingCards();
}

/* Cards facing away get dimmer and slightly smaller */
function shadeRingCards() {
  ringCards.forEach((card, i) => {
    const angle = ((i * CARD_ANGLE + ringRotation) * Math.PI) / 180;
    const facing = (Math.cos(angle) + 1) / 2; // 1 = front, 0 = back
    gsap.set(card, { opacity: 0.3 + 0.7 * facing });
  });
}

function setRingRotation(value, animate = false) {
  ringRotation = value;
  if (animate) {
    gsap.to(ring, {
      rotationY: value,
      duration: 0.5,
      ease: "power2.out",
      onUpdate() {
        ringRotation = gsap.getProperty(ring, "rotationY");
        shadeRingCards();
        syncSlider();
      },
    });
  } else {
    gsap.set(ring, { rotationY: value });
    shadeRingCards();
    syncSlider();
  }
}

function syncSlider() {
  ringSlider.value = Math.round(gsap.utils.wrap(0, 360, ringRotation));
}

layoutRing();

/* Invisible proxy element receives the drag; works for mouse and touch */
const ringProxy = document.createElement("div");
let lastProxyX = 0;

Draggable.create(ringProxy, {
  type: "x",
  trigger: ".ring-stage",
  inertia: true,
  onPress() {
    lastProxyX = this.x;
    gsap.killTweensOf(ring);
  },
  onDrag: spinRing,
  onThrowUpdate: spinRing,
});

function spinRing() {
  const delta = this.x - lastProxyX;
  lastProxyX = this.x;
  setRingRotation(ringRotation + delta * 0.35);
}

/* Slider also drives the ring (finds the shortest path to the chosen angle) */
ringSlider.addEventListener("input", () => {
  const current = gsap.utils.wrap(0, 360, ringRotation);
  let diff = Number(ringSlider.value) - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  setRingRotation(ringRotation + diff);
});

/* --------------------------------------------------------------------------
   5. Rowing — draggable boat along a sine waterway; 5 story cards fade
   in and out based on the boat's proximity.
   -------------------------------------------------------------------------- */
const stage = document.getElementById("river-stage");
const boat = document.getElementById("boat");
const dragHint = document.getElementById("drag-hint");
const rowCards = gsap.utils.toArray(".row-card");

const VIEW_W = 1000;
const VIEW_H = 260;
const WAVE_BASE = 130;
const WAVE_AMP = 30;
const WAVE_FREQ = Math.PI * 2 * 1.15;
const WAVE_PHASE = 0.5;
const RIVER_HALF = 36;

const waveY = (p) => WAVE_BASE + WAVE_AMP * Math.sin(p * WAVE_FREQ + WAVE_PHASE);

function buildWavePath(offset, { close = false } = {}) {
  let d = "";
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    d += `${i ? " L" : "M"}${(p * VIEW_W).toFixed(1)} ${(waveY(p) + offset).toFixed(1)}`;
  }
  if (close) {
    for (let i = 100; i >= 0; i--) {
      const p = i / 100;
      d += ` L${(p * VIEW_W).toFixed(1)} ${(waveY(p) - offset).toFixed(1)}`;
    }
    d += " Z";
  }
  return d;
}

document.getElementById("river-top").setAttribute("d", buildWavePath(-RIVER_HALF));
document.getElementById("river-bottom").setAttribute("d", buildWavePath(RIVER_HALF));
document.getElementById("river-flow").setAttribute("d", buildWavePath(0));
document.getElementById("river-fill").setAttribute("d", buildWavePath(RIVER_HALF, { close: true }));

/* gentle "current" flowing along the dashed centre line */
if (!reduceMotion) {
  gsap.to("#river-flow", {
    strokeDashoffset: -240,
    duration: 8,
    ease: "none",
    repeat: -1,
  });
}

let boatDraggable = null;
let hintShown = true;

function boatMaxX() {
  return stage.offsetWidth - boat.offsetWidth;
}

function updateBoat() {
  const maxX = boatMaxX();
  const x = gsap.getProperty(boat, "x");
  const progress = gsap.utils.clamp(0, 1, maxX ? x / maxX : 0);

  const scaleY = stage.offsetHeight / VIEW_H;
  const y = waveY(progress) * scaleY - boat.offsetHeight / 2;

  /* tilt the boat to follow the slope of the water */
  const dp = 0.01;
  const dy = (waveY(Math.min(progress + dp, 1)) - waveY(progress)) * scaleY;
  const dx = dp * stage.offsetWidth;
  const tilt = (Math.atan2(dy, dx) * 180) / Math.PI;

  gsap.set(boat, { y, rotation: tilt });
  boat.setAttribute("aria-valuenow", Math.round(progress * 100));

  /* story cards appear near the boat and fade away as it rows past */
  rowCards.forEach((card) => {
    const at = Number(card.dataset.at);
    const closeness = gsap.utils.clamp(0, 1, 1 - Math.abs(progress - at) / 0.15);
    const lift = card.classList.contains("below") ? 18 : -18;
    gsap.set(card, {
      autoAlpha: closeness,
      y: (1 - closeness) * lift,
      scale: 0.92 + 0.08 * closeness,
    });
  });

  if (hintShown && progress > 0.04) {
    hintShown = false;
    gsap.to(dragHint, { autoAlpha: 0, duration: 0.5 });
  }
}

function createBoatDraggable() {
  if (boatDraggable) boatDraggable.kill();
  boatDraggable = Draggable.create(boat, {
    type: "x",
    bounds: { minX: 0, maxX: boatMaxX() },
    inertia: true,
    edgeResistance: 0.85,
    onDrag: updateBoat,
    onThrowUpdate: updateBoat,
  })[0];
}

createBoatDraggable();
updateBoat();

/* keyboard support for the boat */
boat.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  const step = boatMaxX() / 25;
  const next = gsap.utils.clamp(
    0,
    boatMaxX(),
    gsap.getProperty(boat, "x") + (e.key === "ArrowRight" ? step : -step)
  );
  gsap.to(boat, { x: next, duration: 0.3, ease: "power2.out", onUpdate: updateBoat });
});

/* nudge the boat into view when the section enters */
ScrollTrigger.create({
  trigger: ".rowing",
  start: "top 70%",
  once: true,
  onEnter() {
    if (reduceMotion) return;
    gsap.fromTo(
      boat,
      { x: -boat.offsetWidth },
      { x: 0, duration: 1.4, ease: "power2.out", onUpdate: updateBoat }
    );
  },
});

/* --------------------------------------------------------------------------
   6. Contact form (static site: simulate a send) + footer year
   -------------------------------------------------------------------------- */
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  formStatus.textContent = "Sending…";
  gsap.delayedCall(0.9, () => {
    formStatus.textContent = "Thank you — your message has been noted. (Demo form)";
    gsap.from(formStatus, { autoAlpha: 0, y: 8, duration: 0.5 });
    form.reset();
    button.disabled = false;
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

/* --------------------------------------------------------------------------
   7. Keep geometry honest on resize
   -------------------------------------------------------------------------- */
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    layoutRing();
    createBoatDraggable();
    const clampedX = gsap.utils.clamp(0, boatMaxX(), gsap.getProperty(boat, "x"));
    gsap.set(boat, { x: clampedX });
    updateBoat();
    ScrollTrigger.refresh();
  }, 200);
});
