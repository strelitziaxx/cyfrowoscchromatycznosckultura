(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  const places = {
    krakow: {
      title: "Kraków",
      kicker: "MAMA",
      description: "To skąd moja mama. Nigdy nie zapomnę rojów gołębi przy Sukiennicach, walczących o okruszki obwarzanka. Ale to tak na marginesie — najważniejsza jest atmosfera jakby z innego wieku.",
      image: "images/krakow-folk.jpg"
    },
    rzeszow: {
      title: "Rzeszów",
      kicker: "TATA",
      description: "A stąd mój tata.",
      image: "images/rzeszow-folk.jpg"
    },
    boleslawiec: {
      title: "Bolesławiec",
      kicker: "CERAMIKA LUDOWA",
      description: "Miejsce znane z charakterystycznej ceramiki. Jej wzory, które spotkałam w sklepach nawet poza Polską, inspirują mnie do badania koloru.",
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
  const artwork = $("place-artwork");

  function selectPlace(id) {
    const place = places[id];
    if (!place) return;

    $("place-title").textContent = place.title;
    $("place-kicker").textContent = place.kicker;
    $("place-description").textContent = place.description;

    mapPoints.forEach((point) => {
      const active = point.dataset.place === id;
      point.classList.toggle("active", active);
      point.setAttribute("aria-pressed", String(active));
    });

    if (!artwork || !place.image) return;
    artwork.classList.add("is-loading");

    const finishLoading = () => {
      artwork.classList.remove("is-loading");
      try { updateThemeFromImage(artwork); }
      catch (error) { console.warn("Nie udało się dopasować motywu:", error); }
    };

    artwork.onload = finishLoading;
    artwork.onerror = () => {
      artwork.classList.remove("is-loading");
      console.warn("Nie udało się wczytać obrazu miejsca:", place.image);
    };
    artwork.src = new URL(place.image, document.baseURI).href;
  }

  mapPoints.forEach((point) => {
    point.addEventListener("mouseenter", () => selectPlace(point.dataset.place));
    point.addEventListener("focus", () => selectPlace(point.dataset.place));
    point.addEventListener("click", () => selectPlace(point.dataset.place));
    point.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
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
  const ctx = samplingCanvas ? samplingCanvas.getContext("2d", { willReadFrequently: true }) : null;

  let currentPalette = [];
  let selectedColor = null;
  let shapeCount = 0;
  let currentObjectUrl = null;

  if (upload && image && analyzeButton && countSelect && status && paletteEl && barEl && makerColors && addShapeButton && canvas && canvasInstruction && ctx) {
    upload.addEventListener("change", () => {
      const file = upload.files && upload.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        status.textContent = "Wybierz plik obrazu.";
        upload.value = "";
        return;
      }

      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = URL.createObjectURL(file);
      image.onload = () => {
        empty.hidden = true;
        image.hidden = false;
        analyzeButton.disabled = false;
        status.textContent = "Obraz gotowy. Uruchom analizę kolorów.";
        currentPalette = [];
        paletteEl.innerHTML = '<div class="palette-empty">Uruchom analizę, aby zobaczyć kolory.</div>';
        barEl.innerHTML = "";
        makerColors.innerHTML = '<span class="maker-placeholder">Wygeneruj nową paletę.</span>';
        addShapeButton.disabled = true;
        selectedColor = null;
      };
      image.onerror = () => {
        status.textContent = "Nie udało się otworzyć obrazu. Spróbuj innego pliku.";
        analyzeButton.disabled = true;
      };
      image.src = currentObjectUrl;
    });

    countSelect.addEventListener("change", () => {
      if (image.complete && image.naturalWidth) runAnalysis();
    });
    analyzeButton.addEventListener("click", runAnalysis);
  }

  function runAnalysis() {
    if (!image || !image.naturalWidth || !ctx) {
      status.textContent = "Najpierw wybierz obraz.";
      return;
    }

    analyzeButton.disabled = true;
    status.textContent = "Analizuję próbkę pikseli…";
    $("result-tag").textContent = "OBLICZENIA";

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
        const pixelCount = pixels.length / 4;
        const stride = Math.max(1, Math.floor(pixelCount / 12000));

        for (let p = 0; p < pixelCount; p += stride) {
          const i = p * 4;
          if (pixels[i + 3] >= 128) samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
        }
        if (!samples.length) throw new Error("Brak widocznych pikseli.");

        const k = Math.min(Number(countSelect.value) || 5, samples.length);
        currentPalette = kMeans(samples, k, 12);
        const total = currentPalette.reduce((sum, color) => sum + color.count, 0) || 1;
        currentPalette.forEach((color) => color.share = color.count / total * 100);
        currentPalette.sort((a, b) => b.count - a.count);

        renderPalette(currentPalette);
        renderMakerColors(currentPalette);
        updateThemeFromPalette(currentPalette);
        addShapeButton.disabled = currentPalette.length === 0;
        $("result-tag").textContent = "GOTOWE";
        status.textContent = `Przeanalizowano ${samples.length.toLocaleString("pl-PL")} próbkowanych pikseli.`;
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
    const centroids = [];
    for (let i = 0; i < k; i++) centroids.push(points[Math.floor((i + 0.5) * points.length / k)].slice());

    let assignments = new Array(points.length).fill(0);
    for (let iter = 0; iter < maxIterations; iter++) {
      const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
      for (let i = 0; i < points.length; i++) {
        let best = 0, bestDist = Infinity;
        for (let c = 0; c < k; c++) {
          const dr = points[i][0] - centroids[c][0];
          const dg = points[i][1] - centroids[c][1];
          const db = points[i][2] - centroids[c][2];
          const dist = dr * dr + dg * dg + db * db;
          if (dist < bestDist) { bestDist = dist; best = c; }
        }
        assignments[i] = best;
        sums[best][0] += points[i][0];
        sums[best][1] += points[i][1];
        sums[best][2] += points[i][2];
        sums[best][3]++;
      }

      let changed = false;
      for (let c = 0; c < k; c++) {
        if (sums[c][3] > 0) {
          const next = sums[c].slice(0, 3).map((value) => value / sums[c][3]);
          if (distanceSquared(next, centroids[c]) > 1) changed = true;
          centroids[c] = next;
        }
      }
      if (!changed && iter > 0) break;
    }

    const counts = Array(k).fill(0);
    assignments.forEach((assignment) => counts[assignment]++);
    return centroids.map((rgb, i) => ({
      rgb: rgb.map(Math.round),
      count: counts[i],
      hex: rgbToHex(rgb)
    })).filter((color) => color.count > 0);
  }

  function distanceSquared(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  function updateThemeFromPalette(palette) {
    if (!palette || !palette.length) return;
    const colors = [...palette].sort((a, b) => b.count - a.count);
    root.style.setProperty("--paper", "#f3e8d4");
    root.style.setProperty("--accent", colors[0].hex);
    root.style.setProperty("--panel", (colors[1] || colors[0]).hex);
    root.style.setProperty("--line", (colors[2] || colors[0]).hex);
    root.style.setProperty("--card", (colors[1] || colors[0]).hex);
    root.style.setProperty("--link", (colors[2] || colors[0]).hex);
    root.style.setProperty("--ink", "#342d27");
    root.style.setProperty("--text", "#342d27");
    root.style.setProperty("--muted", "#6e6255");
  }

  function updateThemeFromImage(sourceImage) {
    if (!sourceImage || !sourceImage.naturalWidth) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempCanvas.height = 40;
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
    tempCtx.drawImage(sourceImage, 0, 0, 40, 40);
    const data = tempCtx.getImageData(0, 0, 40, 40).data;
    const samples = [];
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] >= 128) samples.push([data[i], data[i + 1], data[i + 2]]);
    }
    if (samples.length) updateThemeFromPalette(kMeans(samples, 3, 8));
  }

  function renderPalette(palette) {
    paletteEl.innerHTML = "";
    barEl.innerHTML = "";
    const legend = document.createElement("div");
    legend.className = "proportion-legend";

    palette.forEach((color) => {
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
    palette.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "color-choice";
      button.style.background = color.hex;
      button.title = `Wybierz ${color.hex}`;
      button.setAttribute("aria-label", `Wybierz kolor ${color.hex}`);
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        selectedColor = color.hex;
        makerColors.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      });
      makerColors.append(button);
      if (index === 0) selectedColor = color.hex;
    });
  }

  if ($("add-shape") && canvas && canvasInstruction) {
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
        shape.style.width = "0";
        shape.style.height = "0";
        shape.style.borderLeft = `${size / 2}px solid transparent`;
        shape.style.borderRight = `${size / 2}px solid transparent`;
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
  }

  function enableDrag(element) {
    let startX, startY, initialLeft, initialTop;
    element.addEventListener("pointerdown", (event) => {
      const rect = canvas.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      initialLeft = elementRect.left - rect.left;
      initialTop = elementRect.top - rect.top;
      element.setPointerCapture(event.pointerId);
    });
    element.addEventListener("pointermove", (event) => {
      if (!element.hasPointerCapture(event.pointerId)) return;
      const rect = canvas.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - elementRect.width, initialLeft + event.clientX - startX));
      const y = Math.max(0, Math.min(rect.height - elementRect.height, initialTop + event.clientY - startY));
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    });
  }

  const clearButton = $("clear-canvas");
  if (clearButton) clearButton.addEventListener("click", () => {
    canvas.querySelectorAll(".canvas-shape").forEach((element) => element.remove());
    canvasInstruction.hidden = false;
    shapeCount = 0;
  });

  // Start with a working default place; image paths are relative to the repository root.
  selectPlace("krakow");
})();
