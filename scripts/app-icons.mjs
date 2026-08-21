/**
 * The app's icon and launch screen, cut from the logo the site is drawn with.
 *
 *   node scripts/app-icons.mjs            # writes the icon and the splash
 *   node scripts/app-icons.mjs --variants # also writes the three to choose from
 *
 * A phone icon is not a logo in a box. It is 60 points wide on a home screen next
 * to twenty other things, it is masked into a rounded square by iOS, and it may
 * not have a transparent pixel in it. So:
 *
 *  - the mark is cropped to its own ink first, because the file it comes from has
 *    three hundred pixels of empty space down one side and centring the *file*
 *    puts the mark off-centre on the phone,
 *  - it fills three quarters of the tile, which is as large as it can be before
 *    the mask starts cutting corners off the letters,
 *  - the ground is painted, never left transparent,
 *  - and the launch screen is the same picture with the mark small, so the
 *    handover to the film curtain inside the app is a change of picture rather
 *    than a change of subject.
 *
 * Written with Python's imaging library through the shell rather than a new npm
 * dependency: this runs twice a year at most.
 */

import { execFileSync } from "node:child_process";

const PAPER = "#fffcf6";
const PURPLE = "#8b3fff";

const python = `
import sys
from PIL import Image, ImageFilter, ImageDraw

MARK = "public/logo.png"
PAPER = (255, 252, 246)
PURPLE = (139, 63, 255)

def ink():
    """The mark, cropped to itself. The file has empty space down one side."""
    im = Image.open(MARK).convert("RGBA")
    return im.crop(im.getbbox())

def fitted(mark, side, share):
    """The mark, as large as it goes inside \`share\` of a square of \`side\`."""
    room = int(side * share)
    scale = min(room / mark.width, room / mark.height)
    return mark.resize((max(1, int(mark.width * scale)), max(1, int(mark.height * scale))), Image.LANCZOS)

def middle(canvas, mark, lift=0.0):
    """Centred, with an optional nudge upwards — letters read better a little
       above the middle of a tile than dead centre."""
    x = (canvas.width - mark.width) // 2
    y = int((canvas.height - mark.height) / 2 - canvas.height * lift)
    canvas.paste(mark, (x, y), mark)
    return canvas

def on_paper(side, share=0.74):
    canvas = Image.new("RGB", (side, side), PAPER)
    return middle(canvas, fitted(ink(), side, share), 0.01)

def on_purple(side, share=0.74):
    """Knocked out: the mark's own shape, painted in paper, on purple."""
    canvas = Image.new("RGB", (side, side), PURPLE)
    mark = fitted(ink(), side, share)
    paper = Image.new("RGBA", mark.size, PAPER + (255,))
    paper.putalpha(mark.getchannel("A"))
    return middle(canvas, paper, 0.01)

def with_bloom(side, share=0.7):
    """Paper, with the purple bleeding into it behind the letters — the glow the
       front page puts behind the mark over a moving picture."""
    canvas = Image.new("RGB", (side, side), PAPER)
    mark = fitted(ink(), side, share)
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    stamp = Image.new("RGBA", mark.size, PURPLE + (255,))
    stamp.putalpha(mark.getchannel("A"))
    glow = middle(glow, stamp, 0.01)
    glow = glow.filter(ImageFilter.GaussianBlur(side * 0.045))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), glow).convert("RGB")
    return middle(canvas, mark, 0.01)

made = []

# The icon itself, and the same picture at the sizes the web app asks for.
icon = on_purple(1024)
icon.save("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
made.append("ios app icon 1024")

for size in (192, 512):
    on_purple(size).save(f"public/app-icon-{size}.png")
    made.append(f"public/app-icon-{size}.png")

# The launch screen: the same ground, the mark small, so the film curtain that
# takes over from it is a change of picture rather than of subject.
splash = Image.new("RGB", (2732, 2732), PAPER)
splash = middle(splash, fitted(ink(), 2732, 0.30), 0.0)
for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
    splash.save(f"ios/App/App/Assets.xcassets/Splash.imageset/{name}")
made.append("ios launch screen 2732")

if "--variants" in sys.argv:
    on_paper(1024).save("native/art/icon-paper.png")
    on_purple(1024).save("native/art/icon-purple.png")
    with_bloom(1024).save("native/art/icon-bloom.png")
    made.append("native/art/icon-{paper,purple,bloom}.png")

print("\\n".join("  " + m for m in made))
`;

console.log("Cutting the icon from public/logo.png…\n");
console.log(
  execFileSync("python3", ["-c", python, ...process.argv.slice(2)], { encoding: "utf8" }),
);
console.log(`Ground: ${PURPLE} for the icon, ${PAPER} for the launch screen.\n`);
