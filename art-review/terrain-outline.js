    function buildOutlinedTerrain(image) {
      // Build once at load time. Follow the artwork's alpha edges, including
      // openings between bridge pillars; never fill the transparent openings.
      const clean = document.createElement("canvas");
      clean.width = image.naturalWidth;
      clean.height = image.naturalHeight;
      const cleanCtx = clean.getContext("2d", { willReadFrequently: true });
      cleanCtx.drawImage(image, 0, 0);
      const pixels = cleanCtx.getImageData(0, 0, clean.width, clean.height);
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        const low = Math.min(data[i], data[i + 1], data[i + 2]);
        const high = Math.max(data[i], data[i + 1], data[i + 2]);
        if (low > 210 && high - low < 24) data[i + 3] = 0;
      }
      // Neutral pale pixels touching transparency are leftover matte fringe.
      // Darken only those edge pixels so interior stone highlights survive.
      const alpha = new Uint8Array(clean.width * clean.height);
      for (let p = 0; p < alpha.length; p++) alpha[p] = data[p * 4 + 3];
      for (let y = 1; y < clean.height - 1; y++) {
        for (let x = 1; x < clean.width - 1; x++) {
          const p = y * clean.width + x, i = p * 4;
          if (!alpha[p]) continue;
          const low = Math.min(data[i], data[i + 1], data[i + 2]);
          const high = Math.max(data[i], data[i + 1], data[i + 2]);
          if (low > 150 && high - low < 32 &&
              (alpha[p - 1] < 128 || alpha[p + 1] < 128 ||
               alpha[p - clean.width] < 128 || alpha[p + clean.width] < 128)) {
            data[i] = data[i + 1] = data[i + 2] = 0;
          }
        }
      }
      cleanCtx.putImageData(pixels, 0, 0);
      const outline = document.createElement("canvas");
      outline.width = clean.width;
      outline.height = clean.height;
      const outlineCtx = outline.getContext("2d");
      const radius = 3;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) outlineCtx.drawImage(clean, dx, dy);
        }
      }
      outlineCtx.globalCompositeOperation = "source-in";
      outlineCtx.fillStyle = "#000";
      outlineCtx.fillRect(0, 0, outline.width, outline.height);
      outlineCtx.globalCompositeOperation = "destination-out";
      outlineCtx.drawImage(clean, 0, 0);
      outlineCtx.globalCompositeOperation = "source-over";
      outlineCtx.drawImage(clean, 0, 0);
      return outline;
    }
