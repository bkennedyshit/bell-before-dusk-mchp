from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def cleaned(path: Path):
    image = Image.open(path).convert("RGBA")
    px = image.load(); width, height = image.size
    seen = bytearray(width * height); queue = deque()
    def matte(x, y):
        r, g, b, _ = px[x, y]
        return min(r, g, b) > 225 and max(r, g, b) - min(r, g, b) < 14
    def push(x, y):
        p = y * width + x
        if not seen[p] and matte(x, y): seen[p] = 1; queue.append((x, y))
    for x in range(width): push(x, 0); push(x, height - 1)
    for y in range(1, height - 1): push(0, y); push(width - 1, y)
    while queue:
        x, y = queue.popleft(); px[x, y] = (*px[x, y][:3], 0)
        if x: push(x - 1, y)
        if x + 1 < width: push(x + 1, y)
        if y: push(x, y - 1)
        if y + 1 < height: push(x, y + 1)
    return image

def audit(name, cols, rows, clear_last=0):
    image = cleaned(ROOT / "assets" / "characters" / name)
    width, height = image.size; cw, ch = width // cols, height // rows
    if clear_last:
        alpha = image.getchannel("A")
        from PIL import ImageDraw
        ImageDraw.Draw(alpha).rectangle((0, ch * rows - clear_last, width, height), fill=0)
        image.putalpha(alpha)
    print(f"{name}: cell {cw}x{ch}")
    alpha = image.getchannel("A")
    for row in range(rows):
        values=[]
        for col in range(cols):
            crop=alpha.crop((col*cw,row*ch,(col+1)*cw,(row+1)*ch))
            occupied=[]
            for y in range(ch):
                count=sum(1 for value in crop.crop((0,y,cw,y+1)).getdata() if value>64)
                if count>=3: occupied.append(y)
            bottom=max(occupied) if occupied else 0
            values.append(f"{bottom/ch:.3f}")
        print(f"  row {row}: [{', '.join(values)}]")

audit("edo-citizens-sidewalk-v2.png", 6, 2)
audit("edo-citizens-verticalwalk-v1.png", 6, 4, clear_last=18)
audit("edo-citizens-v1.png", 3, 2)
