"""Read-only atlas measurements: principal silhouette, then both feet's extent."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]

def measure(name, columns, rows, matte=False, inset=0):
    pixels = np.array(Image.open(ROOT / name).convert('RGBA'))
    alpha = pixels[:, :, 3] > 64
    if matte:
        rgb = pixels[:, :, :3].astype(int)
        neutral = (rgb.min(2) > 225) & (rgb.max(2) - rgb.min(2) < 14)
        border = np.zeros_like(neutral)
        border[0, :] = border[-1, :] = True
        border[:, 0] = border[:, -1] = True
        alpha &= ~ndimage.binary_propagation(border & neutral, mask=neutral)
    if 'verticalwalk' in name:
        alpha[750:768, :] = False  # Matches the runtime's neighbor-row clipping.
    h, w = alpha.shape
    cw, ch = w // columns, h // rows
    anchors = []
    for row in range(rows):
        result = []
        for col in range(columns):
            cell = alpha[row*ch+inset:(row+1)*ch-inset, col*cw+inset:(col+1)*cw-inset]
            labels, _ = ndimage.label(cell)
            counts = np.bincount(labels.ravel()); counts[0] = 0
            main = labels == counts.argmax()
            yy, xx = np.nonzero(main)
            bottom = yy.max() + 1
            # Include both shoes, not just the single lowest pixel of one step.
            band = main[max(yy.min(), bottom - round((bottom - yy.min()) * .15)):bottom]
            _, feet_x = np.nonzero(band)
            center = (feet_x.min() + feet_x.max() + 1) / 2
            result.append([float(center/cell.shape[1]), float(bottom/cell.shape[0])])
        anchors.append(result)
    return {'width': w, 'height': h, 'anchors': anchors}

if __name__ == '__main__':
    result = {
        'hero': measure('assets/hero/samurai-courier-sprites-v2.png', 4, 4),
        'walk': measure('assets/characters/edo-citizens-sidewalk-v2.png', 6, 2, True, 2),
        'vertical': measure('assets/characters/edo-citizens-verticalwalk-v1.png', 6, 4, True, 2),
        'portrait': measure('assets/characters/edo-citizens-v1.png', 3, 2, True, 2)
    }
    print(json.dumps(result, indent=None if '--json' in sys.argv else 2))
