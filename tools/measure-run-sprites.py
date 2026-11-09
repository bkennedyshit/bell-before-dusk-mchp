"""Read-only sprite analysis. Emit registration/mask metadata, never edit artwork."""
from pathlib import Path
import json
import gc
import numpy as np
from PIL import Image
from scipy import ndimage

root = Path(__file__).resolve().parents[1]
result = {}
def feet(mask, rgb):
    ys, xs = np.nonzero(mask)
    if not len(ys): return []
    top, bottom = ys.min(), ys.max()
    boot = mask.copy()
    boot[:int(top+(bottom-top)*.77)] = False
    boot &= (rgb[:,:,0] >= rgb[:,:,1]*.88) & (rgb[:,:,:3].min(2) < 115)
    by, bx = np.nonzero(boot)
    if not len(by): return []
    middle = (bx.min()+bx.max())/2
    contacts=[]
    for half in [boot & (np.arange(mask.shape[1])[None,:] <= middle), boot & (np.arange(mask.shape[1])[None,:] > middle)]:
        py,px=np.nonzero(half)
        if not len(py): continue
        y=int(py.max()); x=px[py>=y-3]
        contacts.append([round(float(x.mean()),2), y+1, max(7, min(40, int(x.max()-x.min()+1)/2))])
    return contacts
for name, columns in [('courier-run-v3.png', 4), ('courier-diagonal-run-v1.png', 4),
                      ('red-bandit-eight-directions-v1.png', 8)]:
    folder = 'hero' if name.startswith('courier') else 'characters'
    pixels=np.array(Image.open(root / 'assets' / folder / name).convert('RGBA'))
    alpha = pixels[:,:,3] > 64
    labels, count = ndimage.label(alpha)
    sizes = np.bincount(labels.ravel())
    cells = [None] * (columns * 4)
    for label, region in enumerate(ndimage.find_objects(labels), 1):
        if region is None or sizes[label] <= 100:
            continue
        ys, xs = region
        mask = labels[ys, xs] == label
        py, px = np.nonzero(mask)
        slot = min(3, int((py.mean() + ys.start) / (alpha.shape[0]/4))) * columns + min(columns-1, int((px.mean()+xs.start)/(alpha.shape[1]/columns)))
        if cells[slot] and cells[slot]['area'] >= int(sizes[label]):
            continue
        h, w = mask.shape
        runs = []
        for y, row in enumerate(mask):
            edges = np.diff(np.pad(row.astype(int), (1, 1)))
            for start, end in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)):
                runs.extend([y, int(start), int(end-start)])
        foot = px[py >= h-12].mean()
        body = px[(py > h*.25) & (py < h*.5)].mean()
        cells[slot] = dict(left=xs.start, top=ys.start, width=w, height=h,
            foot=round(float(foot), 3), body=round(float(body), 3), contacts=feet(mask,pixels[ys,xs,:3]), area=int(sizes[label]), runs=runs)
    result[name] = dict(width=alpha.shape[1], height=alpha.shape[0], cells=cells)
    del pixels,alpha,labels,mask
    gc.collect()
print('window.BELL_SPRITE_CONTACTS=' + json.dumps(result, separators=(',', ':')) + ';')
pixels=np.array(Image.open(root/'assets/hero/samurai-courier-sprites-v2.png').convert('RGBA'))
height,width=pixels.shape[:2];cw=width//4;ch=height//4
poses=[]
for row in range(4):
    for col in range(4):
        tile=pixels[row*ch:(row+1)*ch,col*cw:(col+1)*cw]
        poses.append(feet(tile[:,:,3]>128,tile[:,:,:3]))
print('window.BELL_POSE_FEET='+json.dumps(poses,separators=(',',':'))+';')
