"""
The launch screen: the mark on paper, which is the first frame of the opening.

    python3 scripts/launch-screen.py

iOS renders the launch screen before a single line of the app runs, so it can only
ever be a still, and it can only change with a build. The trick is therefore not
to make the still interesting but to make it *identical* to the first frame of
what follows: the mark, this size, in this position, on this paper. The web
curtain then takes over and moves — and because the two pictures are the same
picture, nothing is seen happening at the join.

Which is also the argument for keeping the animation in the web layer rather than
writing a native one: one implementation, changeable any minute, the same in a
browser as in the app. A native copy would be a second version of the same
drawing, and two versions of one drawing drift.

Writes the three sizes Xcode's Splash.imageset wants, and the ink stamp the app
uses. Run it again whenever the mark changes.
"""

from PIL import Image, ImageChops
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
MARK = HERE / "public" / "logo.png"
OUT = HERE / "ios" / "App" / "App" / "Assets.xcassets" / "Splash.imageset"
PAPER = (255, 252, 246)
SIDE = 2732

def ink() -> Image.Image:
    """
    The mark as a stamp: the brush, and nothing else.

    The file in /public is a scan on white with a soft alpha edge, and the website
    lays it over photographs with `mix-blend-mode: multiply` — which removes the
    white and keeps the purple. Over a video layer that trick is not available:
    Core Animation's blend filters over video are a coin toss (they drew nothing
    at all on the first attempt) and plain alpha compositing puts the scan's pale
    haze over the picture like fog.

    So the multiply is baked into the file instead. Darkness becomes opacity: where
    the brush went, the pixel is opaque and keeps its purple; where the paper was,
    it disappears. The result is a stamp that can be laid over anything by any
    renderer, on a phone or in a launch image, and always looks like ink.
    """
    scan = Image.open(MARK).convert("RGBA")
    onto = Image.new("RGBA", scan.size, (255, 255, 255, 255))
    flat = Image.alpha_composite(onto, scan).convert("RGB")
    stamp = flat.copy()
    stamp.putalpha(ImageChops.invert(flat.convert("L")))
    return stamp


def main() -> None:
    # Square, because a launch image is shown on every shape of screen and the
    # middle is the only part guaranteed to be seen.
    canvas = Image.new("RGB", (SIDE, SIDE), PAPER)

    mark = ink()
    wide = round(SIDE * 0.74)
    mark = mark.resize((wide, round(mark.height * wide / mark.width)), Image.LANCZOS)
    # Once is enough on paper. The doubling was for a photograph underneath.
    canvas.paste(mark, ((SIDE - mark.width) // 2, (SIDE - mark.height) // 2), mark)

    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
        canvas.save(OUT / name, "PNG", optimize=True)
        print("wrote", (OUT / name).relative_to(HERE))

if __name__ == "__main__":
    main()
