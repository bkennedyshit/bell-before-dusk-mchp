function cleanEnemyAtlas(image, kind) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data, width = canvas.width, height = canvas.height;
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const regions = [];
  const isMatte = p => {
    const i = p * 4;
    return Math.min(data[i], data[i+1], data[i+2]) > 210 &&
      Math.max(data[i], data[i+1], data[i+2]) - Math.min(data[i], data[i+1], data[i+2]) < 24;
  };
  for (let seed = 0; seed < seen.length; seed++) {
    if (seen[seed] || !isMatte(seed)) continue;
    let head = 0, tail = 1, minX = width, maxX = 0, minY = height, maxY = 0;
    let gray = 0, white = 0;
    queue[0] = seed; seen[seed] = 1;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width), i = p * 4;
      minX = Math.min(minX,x); maxX = Math.max(maxX,x);
      minY = Math.min(minY,y); maxY = Math.max(maxY,y);
      const value = Math.min(data[i],data[i+1],data[i+2]);
      if (value >= 248) white++;
      if (value >= 233 && value <= 244) gray++;
      for (const next of [x > 0 ? p-1 : -1, x < width-1 ? p+1 : -1, y > 0 ? p-width : -1, y < height-1 ? p+width : -1]) {
        if (next >= 0 && !seen[next] && isMatte(next)) {
          seen[next] = 1; queue[tail++] = next;
        }
      }
    }
    const border = minX === 0 || minY === 0 || maxX === width-1 || maxY === height-1;
    // Checkerboard pockets have both near-white and neutral light-gray pixels.
    // The raider's attack pose encloses a gray-only pocket under its raised arm.
    // This reviewed pocket has too little white to meet the checkerboard test.
    const raiderArmGap = kind === 'demons' && minX >= 840 && maxX <= 863 && minY >= 760 && maxY <= 784;
    const columns = kind === 'town-bandits' ? 6 : 3;
    const rows = kind === 'town-bandits' ? 2 : 3;
    const localX = ((minX+maxX)/2 % (width/columns)) / (width/columns);
    const localY = ((minY+maxY)/2 % (height/rows)) / (height/rows);
    const faceHighlight = kind !== 'demons' && localX > 0.3 && localX < 0.78 && localY > 0.1 && localY < 0.48;
    const checkerPocket = (tail > 40 && gray > tail * 0.12 && white > tail * 0.35) || (tail > 150 && white > tail * 0.7);
    const remove = border || raiderArmGap || (!faceHighlight && checkerPocket);
    if (remove) for (let k = 0; k < tail; k++) data[queue[k]*4+3] = 0;
    if (!border && tail > 15) regions.push({pixels:tail,box:[minX,minY,maxX,maxY],gray,white,removed:remove});
  }
  const alpha = new Uint8Array(width * height);
  for (let p = 0; p < alpha.length; p++) alpha[p] = data[p*4+3];
  let fringe = 0;
  for (let y = 2; y < height-2; y++) for (let x = 2; x < width-2; x++) {
    const p = y*width+x, i = p*4;
    if (!alpha[p]) continue;
    const low = Math.min(data[i],data[i+1],data[i+2]);
    const high = Math.max(data[i],data[i+1],data[i+2]);
    if (low < 120 || high-low > 36) continue;
    let edge = false;
    for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (dx*dx+dy*dy <= 4 && alpha[p+dy*width+dx] === 0) { edge = true; break; }
    }
    if (edge) { data[i] = data[i+1] = data[i+2] = 0; fringe++; }
  }
  context.putImageData(pixels, 0, 0);
  return {canvas, regions, fringe};
}
