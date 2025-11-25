const pad = 40;
let k = 3;
const k_choice = [3, 4, 5];
let cpts = 20;
const UNIT_R = 1;
const palette = [
  [10, 50, 255],
  [10, 255, 50],
  [255, 50, 50],
  [128, 128, 128],
  [230, 245, 40],
];
let view = { s: 1, ox: 0, oy: 0 };
let disk = { cx: 2, cy: 2, r: UNIT_R };
let pts = [];
let kSel;
let ptsInpt;
let ptColor = [];
let legend = "";
let userTuple = [];
let userCircle = null;
let userDepth = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  kSel = createSelect();
  k_choice.forEach((v) => kSel.option(v));
  kSel.selected(k);
  kSel.position(windowWidth - kSel.width - 20, 10);
  pts = generateRandomPoints(cpts);
  recolorPoints();
  ptsInpt = createInput(cpts);
  ptsInpt.attribute("type", "number");
  ptsInpt.attribute("min", 5);
  ptsInpt.attribute("max", 200);
  ptsInpt.size(40);
  ptsInpt.position(windowWidth - ptsInpt.width - 50, 10);
  ptsInpt.changed(() => {
    const n = int(ptsInpt.value());
    pts = generateRandomPoints(n);
    recolorPoints();
    computeView();
    userTuple = [];
    userCircle = null;
  });
  computeView();
}

function draw() {
  randomSeed(1);
  nk = kSel ? int(kSel.value()) : k;
  if (nk != k) {
    k = nk;
    recolorPoints();
  }
  background(255);
  noStroke();
  for (let i = 0; i < pts.length; i++) {
    const s = toScreen(pts[i]);
    const [r, g, b] = palette[ptColor[i] % palette.length];
    fill(r, g, b);
    noStroke();
    circle(s.x, s.y, 6);

    if (userTuple && userTuple.includes(i)) {
      noFill();
      stroke(200, 50, 50); // highlight color
      strokeWeight(2);
      circle(s.x, s.y, 12); // slightly larger ring
    }
  }
  const heavy = heavyTupleSample(500);
  if (heavy && heavy.C) {
    const sC = toScreen({ x: heavy.C.cx, y: heavy.C.cy });
    noFill();
    stroke(30);
    strokeWeight(2);
    circle(sC.x, sC.y, 2 * heavy.C.r * view.s);

    noStroke();
    fill(30);
    for (const P of heavy.T) {
      const sp = toScreen(P);
      circle(sp.x, sp.y, 9);
    }
    legend = `Heavy 4-tuple: depth = ${heavy.depth}  |  |T∩SEC| = ${heavy.inside}`;
    if (userCircle) {
      const sC2 = toScreen({ x: userCircle.cx, y: userCircle.cy });
      noFill();
      stroke(200, 50, 50);
      strokeWeight(2);
      circle(sC2.x, sC2.y, 2 * userCircle.r * view.s);

      noStroke();
      fill(200, 50, 50);
      for (const idx of userTuple) {
        const sp = toScreen(pts[idx]);
        circle(sp.x, sp.y, 9);
      }
    }
    legend += `   •   User 4-tuple depth = ${userDepth}`;
  }
  drawLegendBoxes();
  noStroke();
  fill(120);
  textSize(13);
  textAlign(LEFT, BOTTOM);
  text(
    "Tip: click near a point to inspect a 4-tuple and its depth",
    12,
    height - 10
  );
}

function drawLegendBoxes() {
  const x0 = 12,
    y0 = 14;
  textSize(14);
  textAlign(LEFT, CENTER);

  const padX = 8,
    padY = 6;
  const w = textWidth(legend) + 2 * padX;
  noStroke();
  fill(255, 230);
  rect(x0 - padX, y0 - padY, w, 24, 6);

  fill(20);
  text(legend, x0, y0 + 5);
}

windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
  computeView();
  kSel.position(windowWidth - kSel.width - 20, 10);
  ptsInpt.position(windowWidth - ptsInpt.width - 50, 10);
};

function computeView() {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = min(minX, p.x);
    minY = min(minY, p.y);
    maxX = max(maxX, p.x);
    maxY = max(maxY, p.y);
  }
  const rangeX = maxX - minX || 1; // if all x are equal || 1
  const rangeY = maxY - minY || 1; // if all y are equal || 1
  // Uniform scale so everything fits
  const sx = (width - 2 * pad) / rangeX;
  const sy = (height - 2 * pad) / rangeY;
  const s = min(sx, sy);
  // Ranges
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // Offsets so the data is centered
  const ox = width / 2 - s * cx;
  const oy = height / 2 - s * cy;

  view.s = s;
  view.ox = ox;
  view.oy = oy;
}

function toScreen(p) {
  return { x: view.s * p.x + view.ox, y: view.s * p.y + view.oy };
}

function fromScreen(x, y) {
  return {
    x: (x - view.ox) / view.s,
    y: (y - view.oy) / view.s,
  };
}

function generateRandomPoints(n, range = 3) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: random(range),
      y: random(range),
    });
  }
  return pts;
}

function recolorPoints() {
  ptColor = pts.map(() => floor(random(k)));
}

function circle2(A, B) {
  const cx = (A.x + B.x) / 2,
    cy = (A.y + B.y) / 2;
  const r = Math.hypot(A.x - B.x, A.y - B.y) / 2;
  return { cx, cy, r };
}
function circle3(A, B, C) {
  const ax = A.x,
    ay = A.y,
    bx = B.x,
    by = B.y,
    cx = C.x,
    cy = C.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-12) return null;
  const ax2 = ax * ax + ay * ay,
    bx2 = bx * bx + by * by,
    cx2 = cx * cx + cy * cy;
  const ux = (ax2 * (by - cy) + bx2 * (cy - ay) + cx2 * (ay - by)) / d;
  const uy = (ax2 * (cx - bx) + bx2 * (ax - cx) + cx2 * (bx - ax)) / d;
  const r = Math.hypot(ux - ax, uy - ay);
  return { cx: ux, cy: uy, r };
}
function coversAll(C, pts) {
  if (!C) return false;
  for (const P of pts) {
    const dx = P.x - C.cx,
      dy = P.y - C.cy;
    if (dx * dx + dy * dy > C.r * C.r + 1e-10) return false;
  }
  return true;
}

function secOf4(A, B, C, D) {
  const S = [A, B, C, D];
  let best = null;

  const triples = [
    [A, B, C],
    [A, B, D],
    [A, C, D],
    [B, C, D],
  ];
  for (const [p, q, r] of triples) {
    const C3 = circle3(p, q, r);
    if (coversAll(C3, S) && (!best || C3.r < best.r)) best = C3;
  }

  const pairs = [
    [A, B],
    [A, C],
    [A, D],
    [B, C],
    [B, D],
    [C, D],
  ];
  for (const [p, q] of pairs) {
    const C2 = circle2(p, q);
    if (coversAll(C2, S) && (!best || C2.r < best.r)) best = C2;
  }
  return best;
}

function heavyTupleSample(samples = 500) {
  if (pts.length < 4) return null;
  let best = { depth: -1, C: null, T: null };
  for (let s = 0; s < samples; s++) {
    const idx = new Set();
    while (idx.size < 4) idx.add(floor(random(pts.length)));
    const [i, j, k, l] = [...idx];
    const A = pts[i],
      B = pts[j],
      C = pts[k],
      D = pts[l];
    const circ = secOf4(A, B, C, D);
    if (!circ) continue;

    let inside = 0;
    for (const P of pts) {
      const dx = P.x - circ.cx,
        dy = P.y - circ.cy;
      if (dx * dx + dy * dy <= circ.r * circ.r + 1e-10) inside++;
    }
    const depth = inside - 4;
    if (depth > best.depth) best = { depth, C: circ, T: [A, B, C, D], inside };
  }
  return best;
}

function nearestPointIndex(mx, my, maxDist = 10) {
  let best = -1;
  let bestD2 = maxDist * maxDist;
  for (let i = 0; i < pts.length; i++) {
    const s = toScreen(pts[i]);
    const dx = s.x - mx;
    const dy = s.y - my;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = i;
    }
  }
  return best;
}

function mousePressed() {
  const idx = nearestPointIndex(mouseX, mouseY);
  if (idx === -1) return; // click too far from any point

  // avoid duplicates
  if (!userTuple.includes(idx)) {
    userTuple.push(idx);
  }

  // keep only the last 4 selections
  if (userTuple.length > 4) {
    userTuple.shift();
  }

  // when we have exactly 4 points, compute SEC + depth
  if (userTuple.length === 4) {
    const [i, j, k, l] = userTuple;
    const A = pts[i],
      B = pts[j],
      C = pts[k],
      D = pts[l];
    const circ = secOf4(A, B, C, D);
    if (!circ) {
      userCircle = null;
      userDepth = 0;
      return;
    }

    userCircle = circ;

    // count how many points lie inside this SEC (including the 4)
    let inside = 0;
    for (const P of pts) {
      const dx = P.x - circ.cx;
      const dy = P.y - circ.cy;
      if (dx * dx + dy * dy <= circ.r * circ.r + 1e-10) inside++;
    }
    userDepth = inside - 4; // depth = extra points
  }
}
