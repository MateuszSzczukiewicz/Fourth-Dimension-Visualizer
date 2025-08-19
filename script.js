// ===== GLOBAL STATE =====
let rotations = { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 };
let projectionMode = "orthogonal";
let distance = 5;
let scale = 100;
let autoRotating = false;
let currentShape = "tesseract";
let quality = 20;

let vertices4D = [];
let edges = [];
let faces = [];

// Performance monitoring
let frameCount = 0;
let lastTime = 0;

// Canvas context
let canvas, ctx;

// ===== SHAPE DEFINITIONS =====
const shapes = {
  tesseract: {
    name: "Tesserakt (Hipersześcian 4D)",
    description:
      "Hipersześcian składający się z 8 sześcianów 3D połączonych w przestrzeni 4D",
    stats: { vertices: 16, edges: 32, faces: 24, cells: 8 },
    generate: generateTesseract,
  },
  hypersphere: {
    name: "Hipersfera 4D",
    description: "Powierzchnia kuli w czterowymiarowej przestrzeni",
    stats: { vertices: "~N²", edges: "~N²", faces: "~N²", cells: 1 },
    generate: generateHypersphere,
  },
  simplex: {
    name: "Simplex 4D (5-komórka)",
    description:
      "Najprostszy politop regularny w 4D, składający się z 5 czworościanów",
    stats: { vertices: 5, edges: 10, faces: 10, cells: 5 },
    generate: generateSimplex,
  },
  hyperoctahedron: {
    name: "Hiperoktaedr (16-komórka)",
    description: "Dual tesseraktu z wierzchołkami na osiach współrzędnych",
    stats: { vertices: 8, edges: 24, faces: 32, cells: 16 },
    generate: generateHyperoctahedron,
  },
  hyperdodecahedron: {
    name: "Hiperdodekaedr (120-komórka)",
    description:
      "Najbardziej złożony politop regularny w 4D ze złotym podziałem",
    stats: { vertices: 600, edges: 1200, faces: 720, cells: 120 },
    generate: generateHyperdodecahedron,
  },
  duocylinder: {
    name: "Duocylinder",
    description: "Iloczyn kartezjański dwóch okręgów tworzący torus 4D",
    stats: { vertices: "N²", edges: "2N²", faces: "N²", cells: 1 },
    generate: generateDuocylinder,
  },
  custom: {
    name: "Niestandardowa Figura",
    description:
      "Figura zdefiniowana przez użytkownika z parametryzowanymi właściwościami",
    stats: { vertices: "?", edges: "?", faces: "?", cells: "?" },
    generate: generateCustomShape,
  },
};

// ===== SHAPE GENERATORS =====
function generateTesseract() {
  vertices4D = [];
  edges = [];

  // Generate all combinations of ±1 in 4D
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        for (let w = -1; w <= 1; w += 2) {
          vertices4D.push([x, y, z, w]);
        }
      }
    }
  }

  // Connect vertices that differ by exactly one coordinate
  for (let i = 0; i < vertices4D.length; i++) {
    for (let j = i + 1; j < vertices4D.length; j++) {
      const v1 = vertices4D[i];
      const v2 = vertices4D[j];
      let differences = 0;

      for (let k = 0; k < 4; k++) {
        if (v1[k] !== v2[k]) differences++;
      }

      if (differences === 1) {
        edges.push([i, j]);
      }
    }
  }
}

function generateHypersphere() {
  vertices4D = [];
  edges = [];

  const n = quality;
  const radius = 1.5;

  // Generate points on 4D sphere using spherical coordinates
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < Math.floor(n / 2); k++) {
        const u = (i / (n - 1)) * Math.PI;
        const v = (j / (n - 1)) * Math.PI;
        const w = (k / (Math.floor(n / 2) - 1)) * 2 * Math.PI;

        const x = radius * Math.sin(u) * Math.sin(v) * Math.cos(w);
        const y = radius * Math.sin(u) * Math.sin(v) * Math.sin(w);
        const z = radius * Math.sin(u) * Math.cos(v);
        const w4 = radius * Math.cos(u);

        vertices4D.push([x, y, z, w4]);
      }
    }
  }

  // Connect nearby points
  for (let i = 0; i < vertices4D.length; i++) {
    for (let j = i + 1; j < vertices4D.length; j++) {
      const dist = distance4D(vertices4D[i], vertices4D[j]);
      if (dist < 0.6) {
        edges.push([i, j]);
      }
    }
  }
}

function generateSimplex() {
  vertices4D = [];
  edges = [];

  // 5 vertices of 4D simplex
  const rawVertices = [
    [1, 1, 1, 1],
    [1, -1, -1, 1],
    [-1, 1, -1, 1],
    [-1, -1, 1, 1],
    [0, 0, 0, -2.5],
  ];

  // Normalize vertices
  vertices4D = rawVertices.map((v) => {
    const length = Math.sqrt(
      v[0] * v[0] + v[1] * v[1] + v[2] * v[2] + v[3] * v[3],
    );
    return [
      (v[0] / length) * 1.8,
      (v[1] / length) * 1.8,
      (v[2] / length) * 1.8,
      (v[3] / length) * 1.8,
    ];
  });

  // Connect all pairs (complete graph)
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      edges.push([i, j]);
    }
  }
}

function generateHyperoctahedron() {
  vertices4D = [];
  edges = [];

  // 8 vertices on coordinate axes
  vertices4D = [
    [1.5, 0, 0, 0],
    [-1.5, 0, 0, 0],
    [0, 1.5, 0, 0],
    [0, -1.5, 0, 0],
    [0, 0, 1.5, 0],
    [0, 0, -1.5, 0],
    [0, 0, 0, 1.5],
    [0, 0, 0, -1.5],
  ];

  // Connect non-opposite vertices
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const v1 = vertices4D[i];
      const v2 = vertices4D[j];

      // Calculate dot product
      let dotProduct = 0;
      for (let k = 0; k < 4; k++) {
        dotProduct += v1[k] * v2[k];
      }

      // Connect if not opposite (dot product != -1)
      if (dotProduct >= -0.5) {
        edges.push([i, j]);
      }
    }
  }
}

function generateHyperdodecahedron() {
  vertices4D = [];
  edges = [];

  // Simplified version using golden ratio
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = 1 / Math.sqrt(3);
  const b = a / phi;
  const c = a * phi;

  // Base vertices (simplified 120-cell)
  const baseVertices = [
    // Tesseract vertices
    [a, a, a, a],
    [a, a, a, -a],
    [a, a, -a, a],
    [a, a, -a, -a],
    [a, -a, a, a],
    [a, -a, a, -a],
    [a, -a, -a, a],
    [a, -a, -a, -a],
    [-a, a, a, a],
    [-a, a, a, -a],
    [-a, a, -a, a],
    [-a, a, -a, -a],
    [-a, -a, a, a],
    [-a, -a, a, -a],
    [-a, -a, -a, a],
    [-a, -a, -a, -a],

    // Golden ratio vertices
    [b, c, 0, 0],
    [b, -c, 0, 0],
    [-b, c, 0, 0],
    [-b, -c, 0, 0],
    [c, 0, b, 0],
    [c, 0, -b, 0],
    [-c, 0, b, 0],
    [-c, 0, -b, 0],
    [0, b, c, 0],
    [0, b, -c, 0],
    [0, -b, c, 0],
    [0, -b, -c, 0],
    [0, 0, b, c],
    [0, 0, b, -c],
    [0, 0, -b, c],
    [0, 0, -b, -c],
  ];

  vertices4D = baseVertices;

  // Connect based on distance
  for (let i = 0; i < vertices4D.length; i++) {
    for (let j = i + 1; j < vertices4D.length; j++) {
      const dist = distance4D(vertices4D[i], vertices4D[j]);
      if (dist > 0.4 && dist < 1.0) {
        edges.push([i, j]);
      }
    }
  }
}

function generateDuocylinder() {
  vertices4D = [];
  edges = [];

  const n = Math.floor(quality / 2) + 2;
  const radius1 = 1.2;
  const radius2 = 1.2;

  // Duocylinder = circle1 × circle2
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const angle1 = (i / n) * 2 * Math.PI;
      const angle2 = (j / n) * 2 * Math.PI;

      const x = radius1 * Math.cos(angle1);
      const y = radius1 * Math.sin(angle1);
      const z = radius2 * Math.cos(angle2);
      const w = radius2 * Math.sin(angle2);

      vertices4D.push([x, y, z, w]);
    }
  }

  // Connect adjacent points
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const idx = i * n + j;
      const nextI = ((i + 1) % n) * n + j;
      const nextJ = i * n + ((j + 1) % n);

      edges.push([idx, nextI]);
      edges.push([idx, nextJ]);
    }
  }
}

function generateCustomShape() {
  const points = parseInt(document.getElementById("customPoints").value);
  const radius = parseFloat(document.getElementById("customRadius").value);

  vertices4D = [];
  edges = [];

  // Create a parametric 4D torus-like shape
  for (let i = 0; i < points; i++) {
    for (let j = 0; j < points; j++) {
      const angle1 = (i / points) * 2 * Math.PI;
      const angle2 = (j / points) * 2 * Math.PI;

      const r = radius * 0.6;
      const R = radius * 1.2;

      const x = (R + r * Math.cos(angle1)) * Math.cos(angle2);
      const y = (R + r * Math.cos(angle1)) * Math.sin(angle2);
      const z = r * Math.sin(angle1);
      const w = Math.sin(angle2 * 3) * 0.4 * radius;

      vertices4D.push([x, y, z, w]);
    }
  }

  // Connect in grid pattern
  for (let i = 0; i < points; i++) {
    for (let j = 0; j < points; j++) {
      const idx = i * points + j;
      const nextI = ((i + 1) % points) * points + j;
      const nextJ = i * points + ((j + 1) % points);

      edges.push([idx, nextI]);
      edges.push([idx, nextJ]);
    }
  }
}

// ===== MATHEMATICAL FUNCTIONS =====
function distance4D(p1, p2) {
  return Math.sqrt(
    Math.pow(p1[0] - p2[0], 2) +
      Math.pow(p1[1] - p2[1], 2) +
      Math.pow(p1[2] - p2[2], 2) +
      Math.pow(p1[3] - p2[3], 2),
  );
}

function rotate4D(point, angles) {
  let [x, y, z, w] = point;

  // Apply rotations in sequence
  const rotations = [
    {
      cos: Math.cos((angles.xy * Math.PI) / 180),
      sin: Math.sin((angles.xy * Math.PI) / 180),
      coords: [0, 1],
    },
    {
      cos: Math.cos((angles.xz * Math.PI) / 180),
      sin: Math.sin((angles.xz * Math.PI) / 180),
      coords: [0, 2],
    },
    {
      cos: Math.cos((angles.xw * Math.PI) / 180),
      sin: Math.sin((angles.xw * Math.PI) / 180),
      coords: [0, 3],
    },
    {
      cos: Math.cos((angles.yz * Math.PI) / 180),
      sin: Math.sin((angles.yz * Math.PI) / 180),
      coords: [1, 2],
    },
    {
      cos: Math.cos((angles.yw * Math.PI) / 180),
      sin: Math.sin((angles.yw * Math.PI) / 180),
      coords: [1, 3],
    },
    {
      cos: Math.cos((angles.zw * Math.PI) / 180),
      sin: Math.sin((angles.zw * Math.PI) / 180),
      coords: [2, 3],
    },
  ];

  let coords = [x, y, z, w];

  rotations.forEach((rot) => {
    const [i, j] = rot.coords;
    const newI = coords[i] * rot.cos - coords[j] * rot.sin;
    const newJ = coords[i] * rot.sin + coords[j] * rot.cos;
    coords[i] = newI;
    coords[j] = newJ;
  });

  return coords;
}

function project4Dto3D(point4D) {
  const [x, y, z, w] = point4D;

  if (projectionMode === "perspective") {
    // Perspective projection using W coordinate
    const factor = distance / (distance + w);
    return [x * factor, y * factor, z * factor];
  } else {
    // Orthogonal projection (ignore W)
    return [x, y, z];
  }
}

function project3Dto2D(point3D) {
  const [x, y, z] = point3D;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Simple perspective projection to 2D
  const factor = 400 / (400 + z * 50);

  return [centerX + x * scale * factor, centerY + y * scale * factor];
}

// ===== RENDERING =====
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (vertices4D.length === 0) return;

  // Transform vertices
  const rotatedVertices = vertices4D.map((v) => rotate4D(v, rotations));
  const projectedVertices = rotatedVertices
    .map((v) => project4Dto3D(v))
    .map((v) => project3Dto2D(v));

  // Render edges with depth sorting
  if (edges.length > 0) {
    const edgesWithDepth = edges
      .map(([i, j]) => {
        if (i >= rotatedVertices.length || j >= rotatedVertices.length)
          return null;

        const depth1 = rotatedVertices[i][2] + rotatedVertices[i][3] * 0.5;
        const depth2 = rotatedVertices[j][2] + rotatedVertices[j][3] * 0.5;
        const avgDepth = (depth1 + depth2) / 2;

        return { edge: [i, j], depth: avgDepth };
      })
      .filter((e) => e !== null);

    // Sort by depth (back to front)
    edgesWithDepth.sort((a, b) => a.depth - b.depth);

    // Render edges
    edgesWithDepth.forEach(({ edge: [i, j], depth }) => {
      if (i >= projectedVertices.length || j >= projectedVertices.length)
        return;

      const [x1, y1] = projectedVertices[i];
      const [x2, y2] = projectedVertices[j];

      // Skip edges that are too far off screen
      if (
        Math.abs(x1) > canvas.width + 100 ||
        Math.abs(y1) > canvas.height + 100 ||
        Math.abs(x2) > canvas.width + 100 ||
        Math.abs(y2) > canvas.height + 100
      ) {
        return;
      }

      // Calculate visual properties based on depth
      const normalizedDepth = Math.max(-4, Math.min(4, depth));
      const alpha = Math.max(0.15, Math.min(1, (normalizedDepth + 6) / 10));
      const hue = 200 + normalizedDepth * 25;
      const lineWidth = Math.max(0.5, alpha * 2.5);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(${hue}, 70%, 65%, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    });
  }

  // Render vertices
  projectedVertices.forEach((pos, i) => {
    if (i >= rotatedVertices.length) return;

    const [x, y] = pos;

    // Skip vertices that are too far off screen
    if (Math.abs(x) > canvas.width + 50 || Math.abs(y) > canvas.height + 50) {
      return;
    }

    const depth = rotatedVertices[i][2] + rotatedVertices[i][3] * 0.5;
    const normalizedDepth = Math.max(-4, Math.min(4, depth));

    const size = Math.max(2, 8 - normalizedDepth);
    const alpha = Math.max(0.4, Math.min(1, (normalizedDepth + 6) / 10));
    const hue = 60 + normalizedDepth * 30;

    // Draw vertex
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(${hue}, 85%, 70%, ${alpha})`;
    ctx.fill();

    // Draw vertex outline
    ctx.strokeStyle = `hsla(${hue}, 85%, 90%, ${alpha * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

// ===== UI FUNCTIONS =====
function changeShape() {
  currentShape = document.getElementById("shapeSelect").value;
  const shape = shapes[currentShape];

  // Show/hide custom controls
  document
    .getElementById("customControls")
    .classList.toggle("active", currentShape === "custom");

  // Generate new shape
  shape.generate();
  updateShapeInfo();
  render();
}

function updateShapeInfo() {
  const shape = shapes[currentShape];
  const stats = shape.stats;

  const shapeInfoElement = document.getElementById("shapeInfo");

  // Calculate actual vertex and edge counts
  const actualVertices = vertices4D.length;
  const actualEdges = edges.length;

  shapeInfoElement.innerHTML = `
        <div class="shape-name">${shape.name}</div>
        <div class="shape-description">${shape.description}</div>
        <div class="shape-stats">
            <span>Wierzchołków: <strong>${actualVertices}</strong></span>
            <span>Krawędzi: <strong>${actualEdges}</strong></span>
        </div>
    `;
}

function setProjection(mode) {
  projectionMode = mode;
  document
    .getElementById("orthogonal")
    .classList.toggle("active", mode === "orthogonal");
  document
    .getElementById("perspective")
    .classList.toggle("active", mode === "perspective");
  render();
}

function autoRotate() {
  autoRotating = !autoRotating;
  const btn = document.getElementById("autoRotateBtn");

  if (autoRotating) {
    btn.innerHTML = '<span class="btn-icon">⏸</span>Stop Auto';
    btn.classList.add("active");

    function animate() {
      if (!autoRotating) return;

      // Smooth multi-axis rotation
      rotations.xy = (rotations.xy + 0.8) % 360;
      rotations.xw = (rotations.xw + 0.6) % 360;
      rotations.zw = (rotations.zw + 0.4) % 360;

      // Update UI
      updateSliderValues();

      render();
      requestAnimationFrame(animate);
    }
    animate();
  } else {
    btn.innerHTML = '<span class="btn-icon">▶</span>Auto Rotacja';
    btn.classList.remove("active");
  }
}

function resetRotation() {
  autoRotating = false;
  const btn = document.getElementById("autoRotateBtn");
  btn.innerHTML = '<span class="btn-icon">▶</span>Auto Rotacja';
  btn.classList.remove("active");

  // Reset all rotations
  rotations = { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 };

  // Update sliders
  updateSliderValues();

  render();
}

function updateSliderValues() {
  const axes = ["xy", "xz", "xw", "yz", "yw", "zw"];

  axes.forEach((axis) => {
    const slider = document.getElementById(`rot${axis.toUpperCase()}`);
    const valueSpan = document.getElementById(`${axis}Value`);

    if (slider && valueSpan) {
      const normalizedValue = Math.round(rotations[axis]) % 360;
      slider.value = normalizedValue;
      valueSpan.textContent = `${normalizedValue}°`;
    }
  });

  // Force a render after updating sliders
  render();
}

// ===== EVENT LISTENERS =====
function setupControls() {
  // Get canvas context
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  // Rotation sliders
  const rotationAxes = [
    { slider: "rotXY", value: "xyValue", key: "xy" },
    { slider: "rotXZ", value: "xzValue", key: "xz" },
    { slider: "rotXW", value: "xwValue", key: "xw" },
    { slider: "rotYZ", value: "yzValue", key: "yz" },
    { slider: "rotYW", value: "ywValue", key: "yw" },
    { slider: "rotZW", value: "zwValue", key: "zw" },
  ];

  rotationAxes.forEach(({ slider, value, key }) => {
    const sliderElement = document.getElementById(slider);
    const valueElement = document.getElementById(value);

    if (sliderElement && valueElement) {
      sliderElement.addEventListener("input", () => {
        const val = parseInt(sliderElement.value);
        rotations[key] = val;
        valueElement.textContent = `${val}°`;
        render();
      });

      // Also listen for 'change' event for better compatibility
      sliderElement.addEventListener("change", () => {
        const val = parseInt(sliderElement.value);
        rotations[key] = val;
        valueElement.textContent = `${val}°`;
        render();
      });
    }
  });

  // Other controls
  document.getElementById("distance").addEventListener("input", (e) => {
    distance = parseFloat(e.target.value);
    document.getElementById("distValue").textContent = distance.toFixed(1);
    render();
  });

  document.getElementById("scale").addEventListener("input", (e) => {
    scale = parseInt(e.target.value);
    document.getElementById("scaleValue").textContent = scale;
    render();
  });

  document.getElementById("quality").addEventListener("input", (e) => {
    quality = parseInt(e.target.value);
    document.getElementById("qualityValue").textContent = quality;
    // Debounce quality changes to avoid too frequent regeneration
    clearTimeout(window.qualityTimeout);
    window.qualityTimeout = setTimeout(() => {
      changeShape();
    }, 300);
  });

  document
    .getElementById("shapeSelect")
    .addEventListener("change", changeShape);

  // Custom shape controls
  document.getElementById("customPoints").addEventListener("input", (e) => {
    document.getElementById("customPointsValue").textContent = e.target.value;
  });

  document.getElementById("customRadius").addEventListener("input", (e) => {
    document.getElementById("customRadiusValue").textContent = parseFloat(
      e.target.value,
    ).toFixed(1);
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case " ":
        e.preventDefault();
        autoRotate();
        break;
      case "r":
        resetRotation();
        break;
      case "p":
        setProjection(
          projectionMode === "orthogonal" ? "perspective" : "orthogonal",
        );
        break;
    }
  });

  // Touch/mouse interaction for canvas
  let isDragging = false;
  let lastX, lastY;

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    rotations.xy = (rotations.xy + deltaX * 0.5) % 360;
    rotations.xz = (rotations.xz + deltaY * 0.5) % 360;

    updateSliderValues();
    render();

    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  // Touch events for mobile
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    isDragging = true;
    lastX = touch.clientX;
    lastY = touch.clientY;
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastX;
    const deltaY = touch.clientY - lastY;

    rotations.xy = (rotations.xy + deltaX * 0.5) % 360;
    rotations.xz = (rotations.xz + deltaY * 0.5) % 360;

    updateSliderValues();
    render();

    lastX = touch.clientX;
    lastY = touch.clientY;
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    isDragging = false;
  });

  // Mouse wheel for 4D rotation
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 2 : -2;

    if (e.shiftKey) {
      rotations.xw = (rotations.xw + delta) % 360;
    } else if (e.ctrlKey || e.metaKey) {
      rotations.zw = (rotations.zw + delta) % 360;
    } else {
      rotations.yw = (rotations.yw + delta) % 360;
    }

    updateSliderValues();
    render();
  });
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// ===== INITIALIZATION =====
function init() {
  console.log("🔮 Wizualizator Figur 4D - Inicjalizacja...");

  // Setup controls
  setupControls();

  // Generate initial shape
  generateTesseract();
  updateShapeInfo();

  // Initial render
  render();

  // Force initial render after small delay to ensure DOM is ready
  setTimeout(() => {
    render();
    console.log("✅ Pierwszy render wykonany");
  }, 100);

  // Show welcome message
  setTimeout(() => {
    console.log("✨ Gotowe! Sterowanie:");
    console.log("  • Przeciągnij myszą po canvas dla rotacji XY/XZ");
    console.log("  • Kółko myszy dla rotacji YW");
    console.log("  • Shift + kółko dla rotacji XW");
    console.log("  • Ctrl + kółko dla rotacji ZW");
    console.log("  • Spacja - auto rotacja");
    console.log("  • R - reset rotacji");
    console.log("  • P - przełącz projekcję");
    console.log("💖 Miłego oglądania figur 4D, Julia!");
  }, 500);
}

// ===== ERROR HANDLING =====
window.addEventListener("error", (e) => {
  console.error("❌ Błąd wizualizatora:", e.error);

  // Try to recover
  try {
    if (vertices4D.length === 0) {
      generateTesseract();
      updateShapeInfo();
    }
    render();
  } catch (recoveryError) {
    console.error("❌ Nie udało się odzyskać aplikacji:", recoveryError);
  }
});

// ===== START APPLICATION =====
document.addEventListener("DOMContentLoaded", init);

// Expose some functions globally for debugging
window.visualizer4D = {
  rotations,
  vertices4D,
  edges,
  shapes,
  render,
  generateShape: (shapeName) => {
    if (shapes[shapeName]) {
      currentShape = shapeName;
      document.getElementById("shapeSelect").value = shapeName;
      changeShape();
    }
  },
  setRotation: (axis, angle) => {
    if (rotations.hasOwnProperty(axis)) {
      rotations[axis] = angle % 360;
      updateSliderValues();
      render();
    }
  },
  exportVertices: () => JSON.stringify(vertices4D),
  getStats: () => ({
    shape: currentShape,
    vertices: vertices4D.length,
    edges: edges.length,
    projectionMode: projectionMode,
  }),
};
