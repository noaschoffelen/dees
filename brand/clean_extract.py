#!/usr/bin/env python3
"""Clean logo/hand extraction met luminantie-alpha (geen gekleurde randen)."""
from PIL import Image

OUT = "site/assets/img"
BLACK=(13,13,13); WHITE=(255,255,255); BLUE=(148,197,237); PURPLE=(95,27,71); RED=(241,31,10)

def lum(rgb): return 0.299*rgb[0] + 0.587*rgb[1] + 0.114*rgb[2]

def alpha_from(img, bg, floor=0.10, knee=0.94):
    """Geeft een 'L'-mode afbeelding terug die als alpha dient.
    Inkt (donker) -> opaak, achtergrond (bg) -> transparant. Kleur wordt later
    geforceerd, dus er blijft NOOIT een gekleurde rand over."""
    L = img.convert("L")
    Lbg = lum(bg); denom = max(1.0, Lbg*knee)
    lut = []
    for v in range(256):
        a = (Lbg - v) / denom
        a = 0.0 if a < 0 else (1.0 if a > 1 else a)
        if a < floor: a = 0.0
        lut.append(int(round(a*255)))
    return L.point(lut)

def colored(alpha_L, color):
    im = Image.new("RGBA", alpha_L.size, (color[0], color[1], color[2], 0))
    im.putalpha(alpha_L)
    return im

def sample(im, x, y, r=6):
    R=G=B=c=0
    for dx in range(-r, r+1):
        for dy in range(-r, r+1):
            p = im.getpixel((x+dx, y+dy)); R+=p[0]; G+=p[1]; B+=p[2]; c+=1
    return (R//c, G//c, B//c)

# ---------------------------------------------------------------- LOGO
grid = Image.open("brand/extracted/grid-34.png").convert("RGB")
W, H = grid.size
mask = grid.convert("L").point(lambda v: 255 if v < 245 else 0)
bx = mask.getbbox()
midx = (bx[0]+bx[2])//2; midy = (bx[1]+bx[3])//2
tl = grid.crop((bx[0], bx[1], midx, midy))          # zwart logo op lichtblauw
bg = sample(tl, 30, 30)
print("logo bg (lichtblauw):", bg)

lock_a = alpha_from(tl, bg, floor=0.11, knee=0.93)
bb = lock_a.getbbox()
lock_a = lock_a.crop(bb)
print("lockup alpha:", lock_a.size)

# wordmerk = bovenste ~66% (zonder tagline), opnieuw trimmen
lw, lh = lock_a.size
wm_a = lock_a.crop((0, 0, lw, int(lh*0.66)))
wm_a = wm_a.crop(wm_a.getbbox())
print("wordmark alpha:", wm_a.size)

variants = {"black":BLACK, "white":WHITE, "blue":BLUE, "purple":PURPLE, "red":RED}
for name, col in variants.items():
    colored(lock_a, col).save(f"{OUT}/logo/dees-lockup-{name}.png")
    colored(wm_a, col).save(f"{OUT}/logo/dees-wordmark-{name}.png")

# favicon: lichtblauw vlak + zwart wordmerk
fav = Image.new("RGBA", (256, 256), BLUE+(255,))
w2 = colored(wm_a, BLACK); r = 208/w2.width
w2 = w2.resize((208, int(w2.height*r)))
fav.alpha_composite(w2, ((256-w2.width)//2, (256-w2.height)//2))
fav.save(f"{OUT}/logo/favicon.png")
print("favicon ok")

# ---------------------------------------------------------------- HANDEN
import math
def hands_from(path, bg_expected, floor, out_circle):
    im = Image.open(path).convert("RGB"); W, H = im.size
    bg = sample(im, 24, H//2)
    a = alpha_from(im, bg, floor=floor, knee=0.92)   # hele pagina -> alpha
    # cirkel (centraal vierkant), getrimd
    s = int(H*0.62); cx, cy = W//2, H//2
    circ = a.crop((cx-s//2, cy-s//2, cx+s//2, cy+s//2))
    cimg = colored(circ, BLACK); cimg = cimg.crop(cimg.getbbox())
    cimg.save(f"{OUT}/hands/{out_circle}.png")
    return im, a, (W, H)

# blauwe cirkel + losse handjes (p47)
im47, a47, (W, H) = hands_from("brand/extracted/hblue-47.png", BLUE, 0.11, "circle-blue")
cx, cy = W//2, H//2; Rr = int(H*0.355); box = int(H*0.1333)
poses = {"right":0,"downright":45,"down":90,"downleft":135,"left":180,"upleft":225,"up":270,"upright":315}
for name, ang in poses.items():
    A = math.radians(ang)
    hx = int(cx+Rr*math.cos(A)); hy = int(cy+Rr*math.sin(A))
    crop = a47.crop((hx-box, hy-box, hx+box, hy+box))
    hand = colored(crop, BLACK); bb = hand.getbbox()
    if bb: hand = hand.crop(bb)
    hand.save(f"{OUT}/hands/h-{name}.png")
print("blauwe handjes ok")

# rode cirkel (p48)
hands_from("brand/extracted/hred-48.png", RED, 0.13, "circle-red")
print("rode cirkel ok")
print("KLAAR")
