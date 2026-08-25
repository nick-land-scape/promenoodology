"""
The launch screen: the mark on paper, which is the whole opening.

    python3 scripts/launch-screen.py

iOS renders the launch screen before a single line of the app runs, so it can only
ever be a still, and it can only change with a build. For a while it was the first
frame of a second opening drawn in the web view — same mark, same paper, same
size, so that nothing was seen happening at the join. That web curtain is gone:
two openings in a row is one too many, and the one that can be drawn before the
app is running is the one worth keeping. This still is now the only picture the
app opens with, and it is taken away as soon as there is a screen behind it (see
components/app/Opening.tsx).

Writes the three sizes Xcode's Splash.imageset wants. Run it again whenever the
mark changes — and remember the storyboard shows this **aspect fit**, not fill:
the picture is square and the screen is not, and a square scaled to *cover* a tall
screen is scaled by its height, which makes the mark twice the size and cuts the
ends off it.
"""

from PIL import Image, ImageChops
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
MARK = HERE / "public" / "logo.png"
OUT = HERE / "ios" / "App" / "App" / "Assets.xcassets" / "Splash.imageset"
PAPER = (255, 252, 246)
SIDE = 2732

def flat() -> Image.Image:
    """
    The mark, flattened onto white — the scan as it was drawn.

    There used to be a stamp here instead: the same scan with darkness turned into
    opacity, so it could be laid over anything by any renderer. That was for a film
    underneath it, and the film is gone. On paper the stamp was the wrong answer
    twice over — a mid-purple stroke is only about forty per cent opaque by that
    rule, so what should be ink came out as a wash, visibly paler than the same
    mark drawn anywhere else in the app.

    Multiply is what the rest of this project uses, and multiply is exact: paper is
    all but white, so the scan multiplied onto it *is* the scan. Flattening it here
    and multiplying below gets that, with no alpha in it to go pale.
    """
    scan = Image.open(MARK).convert("RGBA")
    onto = Image.new("RGBA", scan.size, (255, 255, 255, 255))
    return Image.alpha_composite(onto, scan).convert("RGB")


def main() -> None:
    # Square, because a launch image is shown on every shape of screen and the
    # middle is the only part guaranteed to be seen.
    canvas = Image.new("RGB", (SIDE, SIDE), PAPER)

    # 74 per cent of the square, which is 74 per cent of the short side of any
    # screen once the storyboard fits the square inside it. It was chosen to match
    # a copy of this mark that the web view drew a second later; that copy is gone,
    # and the proportion is kept because it is the right one on every screen.
    mark = flat()
    wide = round(SIDE * 0.74)
    mark = mark.resize((wide, round(mark.height * wide / mark.width)), Image.LANCZOS)

    # Multiplied on, not pasted on: the scan is a drawing on white, and multiply is
    # what turns a drawing on white into ink on paper. Paste would put the white
    # there too, in a rectangle.
    at = ((SIDE - mark.width) // 2, (SIDE - mark.height) // 2)
    patch = canvas.crop((at[0], at[1], at[0] + mark.width, at[1] + mark.height))
    canvas.paste(ImageChops.multiply(patch, mark), at)

    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
        canvas.save(OUT / name, "PNG", optimize=True)
        print("wrote", (OUT / name).relative_to(HERE))

if __name__ == "__main__":
    main()
