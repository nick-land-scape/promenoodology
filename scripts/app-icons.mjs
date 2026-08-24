/**
 * The app's icon and launch screen, cut from the logo the site is drawn with.
 *
 *   node scripts/app-icons.mjs            # writes both phones' icons and splashes
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

# ---------------------------------------------------------------- Android

# The same two pictures, cut for the other phone.
#
# Android draws an icon three ways and the store draws a fourth, so there are four
# jobs here rather than one:
#
#  - the legacy square, for versions before adaptive icons: the finished picture,
#    ground and all, at five densities;
#  - the round one, which some launchers ask for by name: the same picture, since
#    the system does the masking;
#  - the adaptive *foreground*, which is a transparent layer the launcher moves
#    against a separate background and crops to whatever shape it likes. Only the
#    middle two thirds of it is guaranteed to survive, so the mark is drawn at
#    half the tile rather than three quarters — a foreground filling the same
#    share as the flat icon loses its corners to a circle mask;
#  - and the background, which is the purple, as a colour rather than a picture.

def transparent(side, share):
    """The mark alone, in paper, on nothing — the adaptive foreground."""
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    mark = fitted(ink(), side, share)
    paper = Image.new("RGBA", mark.size, PAPER + (255,))
    paper.putalpha(mark.getchannel("A"))
    return middle(canvas, paper, 0.01)

ANDROID = "android/app/src/main/res"
for folder, flat, fore in (
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432),
):
    square = on_purple(flat).convert("RGBA")
    square.save(f"{ANDROID}/mipmap-{folder}/ic_launcher.png")
    square.save(f"{ANDROID}/mipmap-{folder}/ic_launcher_round.png")
    # 0.5 of 108dp leaves the mark inside the 66dp any launcher is allowed to keep.
    transparent(fore, 0.5).save(f"{ANDROID}/mipmap-{folder}/ic_launcher_foreground.png")
made.append("android icons, five densities")

# The launch screen, at the shapes Android asks for. The mark is 30% of the
# shorter side wherever it is drawn, which is what it is on iOS — the picture that
# follows is the same picture, and that is the whole point of it.
def screen(width, height):
    canvas = Image.new("RGB", (width, height), PAPER)
    return middle(canvas, fitted(ink(), min(width, height), 0.30), 0.0)

for folder, width, height in (
    ("port-mdpi", 320, 480),
    ("port-hdpi", 480, 800),
    ("port-xhdpi", 720, 1280),
    ("port-xxhdpi", 960, 1600),
    ("port-xxxhdpi", 1280, 1920),
    ("land-mdpi", 480, 320),
    ("land-hdpi", 800, 480),
    ("land-xhdpi", 1280, 720),
    ("land-xxhdpi", 1600, 960),
    ("land-xxxhdpi", 1920, 1280),
):
    screen(width, height).save(f"{ANDROID}/drawable-{folder}/splash.png")
screen(480, 320).save(f"{ANDROID}/drawable/splash.png")
made.append("android launch screens, ten shapes")

# And the one the Play listing wants: 512 square, the same icon.
on_purple(512).save("native/art/play-icon-512.png")
made.append("native/art/play-icon-512.png (the Play listing's icon)")

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
