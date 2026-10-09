(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const places = {
    krakow: {
      title: "Kraków",
      kicker: "MAMA",
      description: "To skąd moja mama. Nigdy nie zapomne rój gołębi przy sukiennicach, walczące o jakąś wszelką cząsteczke obważanka. Ale to tak w nawisie mówiąc, bo główna atrakcja to atmosfera jakby z innego wieku.",
      image: "images/boleslawiec-folk.jpg"
    },
    rzeszow: {
      title: "Rzeszów",
      kicker: "TATA",
      description: "A stąd mój tata.",
      image: "images/krakow-folk.jpg"
    },
    boleslawiec: {
      title: "Bolesławiec",
      kicker: "CERAMIKA LUDOWA",
      description: "Miejsce znane z charakterystycznej ceramiki. Jej wzory, które spotkałam w sklepach nawet poza Polską, to moja inspiracja dla badania koloru.",
      image: "images/boleslawiec-folk.jpg"
    },
    warszawa: {
      title: "Warszawa",
      kicker: "STOLICA",
      description: "Warszawa — kolejny punkt na mapie inspiracji.",
      image: "images/warszawa-folk.jpg"
    }
  };
  const mapPoints = [...document.querySelectorAll(".map-point")];
  function selectPlace(id) {
  const place = places[id];
  if (!place) return;

  $("place-title").textContent = place.title;
  $("place-kicker").textContent = place.kicker;
  $("place-description").textContent = place.description;

  mapPoints.forEach(point => {
    const active = point.dataset.place === id;
    point.classList.toggle("active", active);
    point.setAttribute("aria-pressed", String(active));
  });

  const artwork = $("place-artwork");
  if (!artwork || !place.image) return;

  const applyTheme = () => {
    try {
      updateThemeFromImage(artwork);
    } catch (error) {
      console.error("Theme update failed:", error);
    }
  };

  if (artwork.dataset.currentImage === place.image &&
      artwork.complete && artwork.naturalWidth) {
    applyTheme();
    return;
  }

  artwork.onload = () => {
    artwork.classList.remove("is-loading");
    applyTheme();
  };

  artwork.onerror = () => {
    artwork.classList.remove("is-loading");
    console.error("Could not load image:", place.image);
  };

  artwork.classList.add("is-loading");
  artwork.dataset.currentImage = place.image;
  artwork.src = place.image;
}

function updateThemeFromImage(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true
  });

  // Small sample = fast computation.
  canvas.width = 40;
  canvas.height = 40;

  ctx.drawImage(image, 0, 0, 40, 40);

  const pixels = ctx.getImageData(
    0, 0, 40, 40
  ).data;

  const samples = [];

  for (let i = 0; i < pixels.length; i += 16) {
    if (pixels[i + 3] < 128) continue;

    samples.push([
      pixels[i],
      pixels[i + 1],
      pixels[i + 2]
    ]);
  }

  if (!samples.length) return;

  // Reuse the k-means function already in your script.
  const colors = kMeans(samples, 3, 10);
  const colors = currentPalette;

if (colors.length >= 4) {
  const root = document.documentElement;

  root.style.setProperty("--paper", paletteColor(colors[0]));
  root.style.setProperty("--accent", paletteColor(colors[1]));
  root.style.setProperty("--panel", paletteColor(colors[2]));
  root.style.setProperty("--line", paletteColor(colors[3]));
  root.style.setProperty("--card", paletteColor(colors[2]));
  root.style.setProperty("--link", paletteColor(colors[3]));
}

  if (!colors.length) return;

  // Most common cluster becomes the main accent.
  colors.sort((a, b) => b.count - a.count);

  const accent = colors[0].hex;
  const second = colors[1]?.hex || accent;
  const third = colors[2]?.hex || second;

  // Calculate a neutral background from the sampled image.
  const average = samples.reduce(
    (sum, rgb) => sum.map((v, i) => v + rgb[i]),
    [0, 0, 0]
  ).map(v => Math.round(v / samples.length));

  const lightness =
    (average[0] * 0.299) +
    (average[1] * 0.587) +
    (average[2] * 0.114);

  const paper = lightness > 145
    ? rgbToHex(average.map(v => Math.round(v * 0.25 + 191)))
    : "#f7f6f2";

  const root = document.documentElement;

  root.style.setProperty("--paper", paper);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--panel", second);
  root.style.setProperty("--line", third);

  // Choose readable foreground text automatically.
  root.style.setProperty(
    "--ink",
    lightness > 145 ? "#20211f" : "#20211f"
  );

  root.style.setProperty("--muted", "#66675f");

  // Keep the map marker in sync with the theme.
  document.querySelectorAll(".point-dot").forEach(dot => {
    dot.style.fill = accent;
  });
}
  mapPoints.forEach(point => {
    point.addEventListener("mouseenter", () => selectPlace(point.dataset.place));
    point.addEventListener("focus", () => selectPlace(point.dataset.place));
    point.addEventListener("click", () => selectPlace(point.dataset.place));
    point.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectPlace(point.dataset.place);
      }
    });
  });

  const upload = $("image-upload");
  const image = $("source-image");
  const empty = $("empty-state");
  const analyzeButton = $("analyze-button");
  const countSelect = $("cluster-count");
  const status = $("analysis-status");
  const paletteEl = $("palette");
  const barEl = $("proportion-bar");
  const makerColors = $("maker-colors");
  const addShapeButton = $("add-shape");
  const canvas = $("creative-canvas");
  const canvasInstruction = $("canvas-instruction");
  const samplingCanvas = $("sampling-canvas");
  const ctx = samplingCanvas.getContext("2d", { willReadFrequently: true });
  let currentPalette = [];
  let selectedColor = null;
  let shapeCount = 0;
  let lastAnalysis = null;

  upload.addEventListener("change", () => {
    const file = upload.files && upload.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      status.textContent = "Wybierz plik obrazu.";
      return;
    }
    const url = URL.createObjectURL(file);
    image.onload = () => {
      empty.hidden = true;
      image.hidden = false;
      analyzeButton.disabled = false;
      status.textContent = "Obraz gotowy. Uruchom analizę kolorów.";
      URL.revokeObjectURL(url);
      currentPalette = [];
      paletteEl.innerHTML = '<div class="palette-empty">Uruchom analizę, aby zobaczyć kolory.</div>';
      barEl.innerHTML = "";
      makerColors.innerHTML = '<span class="maker-placeholder">Wygeneruj nową paletę.</span>';
      addShapeButton.disabled = true;
    };
    image.onerror = () => {
      status.textContent = "Nie udało się otworzyć obrazu. Spróbuj innego pliku.";
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });

  countSelect.addEventListener("change", () => {
    if (image.complete && image.naturalWidth) runAnalysis();
  });
  analyzeButton.addEventListener("click", runAnalysis);

  function runAnalysis() {
    if (!image.naturalWidth) return;
    analyzeButton.disabled = true;
    status.textContent = "Analizuję próbkę pikseli…";
    $("result-tag").textContent = "OBLICZENIA";
    // Defer heavy work by one frame so the status update can render.
    requestAnimationFrame(() => {
      try {
        const maxSide = 180;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        samplingCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        samplingCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        ctx.clearRect(0, 0, samplingCanvas.width, samplingCanvas.height);
        ctx.drawImage(image, 0, 0, samplingCanvas.width, samplingCanvas.height);
        const pixels = ctx.getImageData(0, 0, samplingCanvas.width, samplingCanvas.height).data;
        const samples = [];
        // Deterministic stride sampling keeps the project quick on large photos.
        const pixelCount = pixels.length / 4;
        const stride = Math.max(1, Math.floor(pixelCount / 12000));
        for (let p = 0; p < pixelCount; p += stride) {
          const i = p * 4;
          if (pixels[i + 3] < 128) continue;
          samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
        }
        if (!samples.length) throw new Error("Brak widocznych pikseli.");
        const k = Math.min(Number(countSelect.value), samples.length);
        currentPalette = kMeans(samples, k, 12);
        const total = currentPalette.reduce((sum, c) => sum + c.count, 0) || 1;
        updateThemeFromImage(image);
        currentPalette.forEach(c => c.share = c.count / total * 100);
        currentPalette.sort((a, b) => b.count - a.count);
        lastAnalysis = currentPalette;
        renderPalette(currentPalette);
        renderMakerColors(currentPalette);
        addShapeButton.disabled = false;
        $("result-tag").textContent = "GOTOWE";
        status.textContent = `Przeanalizowano ${samples.length.toLocaleString("pl-PL")} próbkowanych pikseli.`;
        function paletteColor(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
      } catch (error) {
        console.error(error);
        status.textContent = "Nie udało się przeanalizować tego obrazu. Spróbuj innego pliku.";
        $("result-tag").textContent = "BŁĄD";
      } finally {
        analyzeButton.disabled = false;
      }
    });
  }

  function kMeans(points, k, maxIterations) {
    // Initialize centroids from evenly spaced positions in the sampled array.
    let centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push(points[Math.floor((i + 0.5) * points.length / k)].slice());
    }
    let assignments = new Array(points.length).fill(0);
    for (let iter = 0; iter < maxIterations; iter++) {
      const sums = Array.from({length:k}, () => [0,0,0,0]);
      for (let i = 0; i < points.length; i++) {
        let best = 0, bestDist = Infinity;
        for (let c = 0; c < k; c++) {
          const dr = points[i][0]-centroids[c][0];
          const dg = points[i][1]-centroids[c][1];
          const db = points[i][2]-centroids[c][2];
          const dist = dr*dr + dg*dg + db*db;
          if (dist < bestDist) { bestDist = dist; best = c; }
        }
        assignments[i] = best;
        sums[best][0] += points[i][0];
        sums[best][1] += points[i][1];
        sums[best][2] += points[i][2];
        sums[best][3] += 1;
      }
      let changed = false;
      for (let c = 0; c < k; c++) {
        if (sums[c][3] > 0) {
          const next = sums[c].slice(0,3).map(v => v / sums[c][3]);
          if (distanceSquared(next, centroids[c]) > 1) changed = true;
          centroids[c] = next;
        }
      }
      if (!changed && iter > 0) break;
    }
    const counts = Array(k).fill(0);
    for (const a of assignments) counts[a]++;
    return centroids.map((rgb, i) => ({
      rgb: rgb.map(v => Math.round(v)),
      count: counts[i],
      hex: rgbToHex(rgb)
    })).filter(c => c.count > 0);
  }
  function distanceSquared(a,b) {
    return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
  }
  function rgbToHex(rgb) {
    return "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,"0")).join("").toUpperCase();
  }
  function renderPalette(palette) {
    paletteEl.innerHTML = "";
    barEl.innerHTML = "";
    const legend = document.createElement("div");
    legend.className = "proportion-legend";
    palette.forEach((color, index) => {
      const row = document.createElement("div");
      row.className = "palette-item";
      const swatch = document.createElement("div");
      swatch.className = "swatch";
      swatch.style.background = color.hex;
      const meta = document.createElement("div");
      const hex = document.createElement("div");
      hex.className = "color-name";
      hex.textContent = color.hex;
      const rgb = document.createElement("div");
      rgb.className = "color-meta";
      rgb.textContent = `RGB ${color.rgb.join(", ")}`;
      meta.append(hex, rgb);
      const copy = document.createElement("button");
      copy.className = "copy-color";
      copy.textContent = "Kopiuj";
      copy.setAttribute("aria-label", `Kopiuj kolor ${color.hex}`);
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(color.hex);
          copy.textContent = "Skopiowano";
        } catch {
          copy.textContent = color.hex;
        }
      });
      row.append(swatch, meta, copy);
      paletteEl.append(row);

      const segment = document.createElement("div");
      segment.className = "proportion-segment";
      segment.style.background = color.hex;
      segment.style.width = `${color.share}%`;
      segment.title = `${color.hex}: ${color.share.toFixed(1)}%`;
      barEl.append(segment);

      const legendRow = document.createElement("div");
      legendRow.className = "legend-row";
      const dot = document.createElement("span");
      dot.className = "legend-dot";
      dot.style.background = color.hex;
      const label = document.createElement("span");
      label.textContent = color.hex;
      const percent = document.createElement("span");
      percent.textContent = `${color.share.toFixed(1).replace(".", ",")}%`;
      legendRow.append(dot, label, percent);
      legend.append(legendRow);
    });
    paletteEl.append(legend);
  }
  function renderMakerColors(palette) {
    makerColors.innerHTML = "";
    palette.forEach((color, i) => {
      const button = document.createElement("button");
      button.className = "color-choice";
      button.style.background = color.hex;
      button.title = `Wybierz ${color.hex}`;
      button.setAttribute("aria-label", `Wybierz kolor ${color.hex}`);
      button.setAttribute("aria-pressed", String(i === 0));
      button.addEventListener("click", () => {
        selectedColor = color.hex;
        makerColors.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      });
      makerColors.append(button);
      if (i === 0) selectedColor = color.hex;
    });
  }

  addShapeButton.addEventListener("click", () => {
    if (!selectedColor) return;
    canvasInstruction.hidden = true;
    const shapeType = $("shape-select").value;
    const shape = document.createElement("button");
    shape.type = "button";
    shape.className = `canvas-shape shape-${shapeType}`;
    shape.setAttribute("aria-label", "Przesuń kształt kompozycji");
    const size = 42 + (shapeCount % 4) * 13;
    shapeCount++;
    if (shapeType === "triangle") {
      shape.style.setProperty("--half", `${size/2}px`);
      shape.style.setProperty("--shape-height", `${size}px`);
      shape.style.setProperty("--shape-color", selectedColor);
      shape.style.width = "0";
      shape.style.height = "0";
      shape.style.borderLeft = `${size/2}px solid transparent`;
      shape.style.borderRight = `${size/2}px solid transparent`;
      shape.style.borderBottom = `${size}px solid ${selectedColor}`;
    } else {
      shape.style.width = `${size}px`;
      shape.style.height = `${size}px`;
      shape.style.background = selectedColor;
    }
    shape.style.left = `${8 + ((shapeCount * 17) % 65)}%`;
    shape.style.top = `${10 + ((shapeCount * 23) % 65)}%`;
    enableDrag(shape);
    canvas.append(shape);
    shape.focus();
  });
  function enableDrag(el) {
    let startX, startY, initialLeft, initialTop;
    el.addEventListener("pointerdown", e => {
      const rect = canvas.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      initialLeft = er.left - rect.left; initialTop = er.top - rect.top;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", e => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const rect = canvas.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - er.width, initialLeft + e.clientX - startX));
      const y = Math.max(0, Math.min(rect.height - er.height, initialTop + e.clientY - startY));
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    });
  }
  $("clear-canvas").addEventListener("click", () => {
    canvas.querySelectorAll(".canvas-shape").forEach(el => el.remove());
    canvasInstruction.hidden = false;
    shapeCount = 0;
  });
})();
