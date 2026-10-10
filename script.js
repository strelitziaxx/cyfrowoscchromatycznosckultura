(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  const places = {
    "krakow-golebie": {
      title: "Kraków: gołębie",
      kicker: "SZCZURY NIEBA? NIE...",
      description: "Gołębie Krakowskie to stworzenia bliskie mojego serca. Nawet gdy dla niektórych wydawają się proste i zwyczajne, znajduje piękno w rojach ciemnych, szaro-niebieskich piór.",
      image: "images/krakow-golebie.jpg",
      alt: "Gołębie w Krakowie"
    },
    "krakow-kocie-lby": {
      title: "Kraków: kocie łby",
      kicker: "KAMIENIE, KTÓRE PRZEŻYŁY WIEKI",
      description: "Właściwie, to zdjęcie to ulica Lublina, ale kolory oraz ujęcie przypominają mi dokładnej atmosfery dróg średniowiecznych miast, tak jak w Krakowie; te kamienie noszą historie pokoleń, i ich zmęczone, lśniące łby, tutaj widoczne, również służyły moich przodków.",
      image: "images/krakow-kocie-lby.jpg",
      alt: "Kocie łby — brukowana droga w Krakowie"
    },
    "warszawa-syrenka": {
      title: "Warszawa: Syrenka Warszawska",
      kicker: "POLSKA SYRENKA",
      description: "Syrenka Warzawska, symbol stolicy.",
      image: "images/warszawa-syrenka.jpg",
      alt: "Syrenka Warszawska"
    },
    "tatry-oscypek": {
      title: "Tatry: oscypek",
      kicker: "MNIAM MNIAM",
      description: "Oscypek z grilla z żurawiną. Pachnie jak Krupówki i każdy ludowy festiwal w Krakowie. Ma niepowtarzalny kolor, kształt i smak. Nigdy nie sądziłam, że tak będzie mi smakował.",
      image: "images/oscypek-tatry.jpg",
      alt: "Oscypek z południa Polski"
    },
    "mojapolska": {
      title: "Moja Polska",
      kicker: "KORZENIE",
      description: "Oto moja polska. Zaczyna się z rodziną, tutaj zgromadzona na moim chcie w kościele, w ktróym brali ślub moi rodzice w Krakowie.",
      image: "images/rodzina.jpeg",
      alt: "Moja Rodzina"
    },
    
    "rzeszow": {
      title: "Rzeszów",
      kicker: "MIASTO · PODKARPACIE",
      description: "Rzeszów, stolica Podkarpacia; to skąd mój tata. Kwiaty wszędzie.",
      image: "images/rzeszow.jpeg",
      alt: "Rzeszów — miejsce na mapie inspiracji"
    },
    "boleslawiec": {
      title: "Bolesławiec",
      kicker: "CERAMIKA · TRADYCJA",
      description: "Bolesławiec słynie z ceramiki zdobionej charakterystycznymi wzorami. Kolory i motywy na naczyniach łączą tradycję rzemiosła z indywidualną interpretacją. To przykład tego, jak miejsce może być rozpoznawane przez swoje barwy i formy.",
      image: "images/boleslawiec-folk.jpg",
      alt: "Ceramika inspirowana tradycją Bolesławca"
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
    artwork?.setAttribute("alt", place.alt || place.title);

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

    // Blend extracted colors so the site visibly follows the image while text stays readable.
    const ranked = [...palette].filter((color) => color && color.hex && color.rgb);
    if (!ranked.length) return;
    ranked.sort((a, b) => b.count - a.count);

    const toHex = (rgb) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
    const mix = (hex, target, amount) => {
      const rgb = hex.match(/[0-9a-f]{2}/ig).map((v) => parseInt(v, 16));
      const dest = target.match(/[0-9a-f]{2}/ig).map((v) => parseInt(v, 16));
      return toHex(rgb.map((v, i) => v * (1 - amount) + dest[i] * amount));
    };
    const luminance = (hex) => {
      const rgb = hex.match(/[0-9a-f]{2}/ig).map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    const saturation = (rgb) => {
      const values = rgb.map((v) => v / 255);
      return Math.max(...values) - Math.min(...values);
    };

    const lightest = [...ranked].sort((a, b) => luminance(b.hex) - luminance(a.hex))[0];
    const darkest = [...ranked].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0];
    const accentColor = [...ranked].sort((a, b) => saturation(b.rgb) - saturation(a.rgb))[0];
    const secondary = ranked.find((color) => color.hex !== accentColor.hex) || accentColor;
    const paper = mix(lightest.hex, "#FFFFFF", 0.82);
    const panel = mix(lightest.hex, "#FFFFFF", 0.63);
    const card = mix(secondary.hex, "#FFFFFF", 0.76);
    const line = mix(darkest.hex, paper, 0.72);
    const text = luminance(paper) > 0.42 ? mix(darkest.hex, "#171512", 0.58) : "#FFFFFF";
    const muted = mix(text, paper, 0.36);
    const accent = accentColor.hex;
    const link = luminance(accent) < 0.38 ? accent : mix(accent, "#27221E", 0.40);
    const buttonText = luminance(accent) > 0.48 ? "#25211D" : "#FFFFFF";

    const vars = {
      "--paper": paper,
      "--panel": panel,
      "--card": card,
      "--line": line,
      "--accent": accent,
      "--link": link,
      "--input-bg": mix(lightest.hex, "#FFFFFF", 0.88),
      "--button-bg": accent,
      "--button-text": buttonText,
      "--text": text,
      "--ink": text,
      "--muted": muted,
      "--map-bg": mix(secondary.hex, "#FFFFFF", 0.78),
      "--soft-accent": mix(accent, paper, 0.82)
    };
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
  }

  function updateThemeFromImage(sourceImage) {
    if (!sourceImage || !sourceImage.naturalWidth) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempCanvas.height = 72;
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
    tempCtx.drawImage(sourceImage, 0, 0, 72, 72);
    const data = tempCtx.getImageData(0, 0, 40, 40).data;
    const samples = [];
    for (let i = 0; i < data.length; i += 8) {
      if (data[i + 3] >= 128) samples.push([data[i], data[i + 1], data[i + 2]]);
    }
    if (samples.length) updateThemeFromPalette(kMeans(samples, 6, 14));
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
  selectPlace("mojapolska");
})();
