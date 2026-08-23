"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

/**
 * The card's surface, drawn rather than described.
 *
 * CSS can stack gradients and it cannot do the one thing that makes metal look
 * like metal: reflect a room. A gradient is painted on and stays where it is put,
 * so a card built out of them is a picture of a card — turn it and the light does
 * not move, which is exactly the tell. What is here instead is a shader: a rough
 * anisotropic surface, brushed along the long edge, reflecting a made-up room, and
 * the light runs across the face and around the bezel as the card leans.
 *
 * What it does *not* draw is the writing. The name, the number and the mark stay
 * in the document: text in a shader means text baked into a texture, which means
 * it stops being selectable, stops being readable to a screen reader, stops being
 * translated and goes soft on a screen whose pixel ratio nobody predicted. So the
 * object is WebGL and the printing on it is HTML — which is also how a real card
 * is made.
 *
 * It draws on demand, never on a loop. Every frame comes from something that
 * happened: the card was leaned, the paper changed, the window resized. A card
 * sitting still on a screen is a card sitting still, and an idle render loop in a
 * web view inside an app is a battery bill for nothing.
 *
 * And the lean arrives by hand rather than as a prop, which is not a style
 * preference. The tilt library emits its position *while it is updating*, so
 * putting that number into React state means: state changes, component renders,
 * library emits, state changes — "maximum update depth exceeded", and a blank
 * screen where the card was. A lean is not application state anyway. It is one
 * number, sixty times a second, that nothing but this canvas has any use for.
 */

export type Metal = { paint: (lean: { x: number; y: number }) => void };
const CardMetal = forwardRef<
  Metal,
  {
    dark: boolean;
    /* Said once, when there is a picture. Until then the card is the CSS one
       underneath, which is also what it stays as where there is no WebGL. */
    onDrawn?: () => void;
  }
>(function CardMetal({ dark, onDrawn }, handle) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<WebGLRenderingContext | null>(null);
  const where = useRef<{
    lean: WebGLUniformLocation | null;
    size: WebGLUniformLocation | null;
    dark: WebGLUniformLocation | null;
    radius: WebGLUniformLocation | null;
  }>({ lean: null, size: null, dark: null, radius: null });
  const asked = useRef(0);
  const said = useRef(false);
  /* The setup effect runs before the one that knows how to draw, so it asks
     through here rather than calling something that does not exist yet. */
  const soonest = useRef<(() => void) | null>(null);
  /* The latest of everything, read at draw time. A draw asked for twice in one
     frame is one draw with the newer numbers. */
  const now = useRef({ lean: { x: 0, y: 0 }, dark });
  now.current.dark = dark;
  /* Held in a ref rather than depended on. An inline arrow is a new function every
     render, and a `useCallback` that depends on one is a new callback every render
     — which makes every effect below re-run, and with them a draw, for ever. */
  const told = useRef(onDrawn);
  told.current = onDrawn;

  useEffect(() => {
    const board = canvas.current;
    if (!board) return;

    const context =
      board.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        // Nothing is read back and nothing is composited over two frames.
        preserveDrawingBuffer: false,
        powerPreference: "low-power",
      }) ?? null;
    if (!context) return; // No WebGL: the CSS card underneath stands as it is.
    gl.current = context;

    const shader = (kind: number, source: string) => {
      const one = context.createShader(kind)!;
      context.shaderSource(one, source);
      context.compileShader(one);
      /* Said out loud when it fails. A shader that will not compile fails
         silently: the card falls back to the CSS one, which looks like a decision
         somebody made rather than like a bug, and nothing anywhere says why. */
      if (!context.getShaderParameter(one, context.COMPILE_STATUS)) {
        console.warn("the card's shader would not compile:", context.getShaderInfoLog(one));
      }
      return one;
    };

    const program = context.createProgram()!;
    context.attachShader(program, shader(context.VERTEX_SHADER, VERTEX));
    context.attachShader(program, shader(context.FRAGMENT_SHADER, FRAGMENT));
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
      console.warn("the card's shader would not link:", context.getProgramInfoLog(program));
      gl.current = null;
      return;
    }
    context.useProgram(program);

    // One quad, two triangles, and never touched again.
    const quad = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, quad);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      context.STATIC_DRAW,
    );
    const corner = context.getAttribLocation(program, "corner");
    context.enableVertexAttribArray(corner);
    context.vertexAttribPointer(corner, 2, context.FLOAT, false, 0, 0);

    where.current = {
      lean: context.getUniformLocation(program, "lean"),
      size: context.getUniformLocation(program, "size"),
      dark: context.getUniformLocation(program, "dark"),
      radius: context.getUniformLocation(program, "radius"),
    };

    /* There is something to draw now, so draw it: the effect below runs before
       this one on the first pass and found no program to use. */
    if (document.hidden) window.setTimeout(() => soonest.current?.(), 0);
    else window.requestAnimationFrame(() => soonest.current?.());

    return () => {
      context.deleteProgram(program);
      context.deleteBuffer(quad);
      gl.current = null;
    };
  }, []);

  /* One picture, at whatever size the card is on the screen now. */
  const draw = useCallback(() => {
    asked.current = 0;
    const board = canvas.current;
    const context = gl.current;
    if (!board || !context) return;

    /* The card is about 400 points wide and the shading is smooth, so there is
       nothing in it that wants three device pixels per point. Two is plenty and a
       quarter of the fragments of three. */
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const wide = Math.max(1, Math.round(board.clientWidth * ratio));
    const tall = Math.max(1, Math.round(board.clientHeight * ratio));
    if (board.width !== wide || board.height !== tall) {
      board.width = wide;
      board.height = tall;
    }
    context.viewport(0, 0, wide, tall);

    const { lean: at, dark: night } = now.current;
    context.uniform2f(where.current.lean, at.x, at.y);
    context.uniform2f(where.current.size, wide, tall);
    context.uniform1f(where.current.dark, night ? 1 : 0);
    /* The corner, in the shader's own units, worked out from the card's real size
       on the screen: ten points, which is the radius the stylesheet gives it, over
       half the canvas's height. A hard-coded number here means the drawn corner and
       the clipped one disagree the moment the card is a different size, and a
       rounded card inside a slightly-more-rounded mask is a hairline of paper at
       each corner. */
    context.uniform1f(where.current.radius, (20 * ratio) / tall);

    context.clearColor(0, 0, 0, 0);
    context.clear(context.COLOR_BUFFER_BIT);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);

    if (!said.current) {
      said.current = true;
      told.current?.();
    }
  }, []);

  /* Coalesced into the next frame, because a lean arrives as a stream of pointer
     events and each one is not worth its own picture — except where no frame is
     ever coming. A hidden document does not get one, which is the ordinary case in
     a preview pane, where the card would otherwise never be drawn at all and look
     like a shader that does not work. */
  const soon = useCallback(() => {
    if (document.hidden) {
      draw();
      return;
    }
    if (!asked.current) asked.current = window.requestAnimationFrame(draw);
  }, [draw]);
  soonest.current = soon;

  /* The lean, by hand. See the note at the top: this must not go through React. */
  useImperativeHandle(
    handle,
    () => ({
      paint: (lean: { x: number; y: number }) => {
        now.current.lean = lean;
        soon();
      },
    }),
    [soon],
  );

  /* The paper changing is worth a picture, and so is the first one. */
  useEffect(() => {
    soon();
    return () => {
      if (asked.current) window.cancelAnimationFrame(asked.current);
      asked.current = 0;
    };
  }, [dark, soon]);


  /* And once more whenever the card changes size, which on a phone is a rotation
     and on a tablet is the layout changing its mind. */
  useEffect(() => {
    const board = canvas.current;
    if (!board || typeof ResizeObserver === "undefined") return;
    const watching = new ResizeObserver(() => soon());
    watching.observe(board);
    return () => watching.disconnect();
  }, [soon]);

  return <canvas className="member-card-metal-gl" ref={canvas} aria-hidden="true" />;
});

export default CardMetal;

const VERTEX = `
attribute vec2 corner;
varying vec2 place;
void main() {
  place = corner;
  gl_Position = vec4(corner, 0.0, 1.0);
}
`;

/*
 * The surface.
 *
 * Five things, in the order they matter: the shape of the card, the direction the
 * eye is looking from, a room to reflect, the roughness of rolled aluminium, and
 * a bezel that catches all of it differently because it is turned away from the
 * face. The purple is last and least — a hint out of one corner, because on a
 * grey card it is the only colour there is and a little of it is a lot.
 */
const FRAGMENT = `
precision highp float;

varying vec2 place;
uniform vec2 lean;
uniform vec2 size;
uniform float dark;
uniform float radius;

const float BEZEL = 0.009;    // how much of the edge is turned metal, of the half-height

/* Distance to a rounded rectangle, negative inside. The card's own outline: it is
   what gives the edge somewhere to be and the corners something to catch. */
float card(vec2 p, vec2 half_, float r) {
  vec2 d = abs(p) - half_ + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

/* Cheap value noise, for the brush. Nothing here needs to be beautiful on its
   own; it needs to be finer than the eye can resolve and to run one way. */
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

float grain(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

/*
 * The room the card is in, as a direction goes to look for it.
 *
 * Not a photograph of one: a bright band where a ceiling meets a wall, a window
 * up and to the left, a darker floor, and one warm lamp low down on the right.
 * That is enough for a surface to look like it is somewhere. Light paper gets a
 * white room; dark paper gets a room with the lights off and the window still in
 * it, which is why a black card in a dark room still has edges.
 */
vec3 room(vec3 r) {
  float up = r.y;

  vec3 ceiling = mix(vec3(0.94, 0.93, 0.96), vec3(0.30, 0.31, 0.36), dark);
  vec3 middle  = mix(vec3(0.72, 0.72, 0.78), vec3(0.11, 0.11, 0.14), dark);
  vec3 floor_  = mix(vec3(0.50, 0.49, 0.54), vec3(0.03, 0.03, 0.04), dark);

  vec3 out_ = mix(floor_, middle, smoothstep(-0.65, 0.05, up));
  out_ = mix(out_, ceiling, smoothstep(0.05, 0.75, up));

  /* The window: a soft rectangle of much brighter light, up and to the left. This
     is the thing that travels across the face as the card turns, and it is the
     whole reason the card reads as metal rather than as a grey gradient. */
  vec2 win = vec2(r.x + 0.42, r.y - 0.44);
  float pane = exp(-dot(win * vec2(1.7, 3.1), win * vec2(1.7, 3.1)) * 5.5);
  out_ += pane * mix(vec3(0.85, 0.85, 0.92), vec3(0.85, 0.86, 0.95), dark);

  /* And a lamp, warm, low and to the right, so the two ends of the card are not
     lit by the same colour. */
  vec2 lamp = vec2(r.x - 0.52, r.y + 0.30);
  float bulb = exp(-dot(lamp * 2.6, lamp * 2.6) * 6.0);
  out_ += bulb * mix(vec3(0.55, 0.44, 0.34), vec3(0.34, 0.24, 0.20), dark);

  return out_;
}

void main() {
  /* Card space: x across, y up, y in [-1, 1]. */
  float ratio = size.x / size.y;
  vec2 p = place * vec2(ratio, 1.0);
  vec2 half_ = vec2(ratio, 1.0);

  float edge = card(p, half_, radius);
  /* Off the card entirely: nothing, and let the paper through. A pixel of feather
     so the corners are not staircases. */
  float feather = 2.2 / size.y;
  float inside = 1.0 - smoothstep(-feather, feather, edge);
  if (inside <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  /* The lean, in radians, from the degrees the tilt reports. */
  vec2 tip = radians(lean);

  /*
   * The normal.
   *
   * A card is not flat: it has been in a pocket. A very shallow dome across the
   * long axis, a little less across the short one, plus the bezel — the outer
   * fortieth of the card rolls away from the face, which is what makes a metal
   * edge a metal edge rather than a drawn line.
   */
  vec2 slope = -p / half_ * 0.06;

  float bezel = smoothstep(-BEZEL * 1.6, 0.0, edge + BEZEL * 0.8) * step(edge, 0.0);
  vec2 outward = normalize(p + vec2(1e-5));
  slope += outward * bezel * 0.9;

  /*
   * The brush: a fine grain running the long way, perturbing the normal across the
   * grain only. Anisotropy done the honest way — the surface really does vary in
   * one direction more than the other, so the highlight really does stretch.
   *
   * The frequency is tied to how many pixels there are rather than picked, and
   * that is the whole difference between brushed metal and static: a grain finer
   * than the pixel grid cannot be drawn, so it aliases, and aliased noise is
   * exactly the horizontal streaking that made the first version of this look like
   * a bad photograph of a card. A quarter of the available rows is as fine as this
   * can honestly go.
   */
  float rows = size.y * 0.22;
  float brush = grain(vec2(p.x * 9.0, p.y * rows)) - 0.5;
  slope.y += brush * 0.028;
  /* A few longer scratches, which is what a card that has been used has. */
  float scratch = grain(vec2(p.x * 2.5 + 11.0, p.y * 70.0)) - 0.5;
  slope.y += scratch * 0.012;

  vec3 n = normalize(vec3(slope, 1.0));

  /* Where the eye is. The lean is applied to the view rather than to the card,
     which comes to the same picture and saves a matrix. */
  vec3 v = normalize(vec3(-tip.y * 1.9, tip.x * 1.9, 1.0));

  vec3 r = reflect(-v, n);
  vec3 lit = room(r);

  /* The metal underneath the reflection. Aluminium is nearly grey and a touch
     cool; gunmetal is the same thing with most of the light taken out of it, which
     is what dark paper needs — a white slab in the middle of a dark screen is
     exactly where the eye goes and exactly where it should not be. */
  vec3 body = mix(vec3(0.99, 0.985, 1.0), vec3(0.16, 0.155, 0.185), dark);
  vec3 colour = body * mix(lit, lit * 0.55 + 0.06, dark);

  /* One tight highlight on top of the reflection, stretched along the brush, for
     the moment the window lines up with the surface. */
  float gloss = pow(max(r.y * 0.35 + r.z, 0.0), 42.0);
  colour += gloss * mix(0.18, 0.16, dark);

  /* The club's purple, out of the bottom right, and only a little: at a third it
     stops being a metal card with a glow in the corner and becomes a purple one. */
  float corner = smoothstep(0.2, 1.5, (p.x / ratio + 0.15) + (-p.y + 0.15));
  colour += vec3(0.545, 0.247, 1.0) * corner * mix(0.085, 0.135, dark);

  /* The bezel again, in light rather than in shape: the turned edge is closer to
     the room than the face is, so it is brighter, and brightest where it happens
     to be pointing at the window. */
  float rim = bezel * (0.30 + 0.70 * max(dot(normalize(vec3(outward, 0.9)), normalize(vec3(-0.5, 0.6, 0.7))), 0.0));
  colour += rim * mix(0.22, 0.22, dark);

  /* And the hairline where the face meets the bezel, which is the line that says
     the card has a thickness. */
  float crease = exp(-pow((edge + BEZEL * 1.9) / (BEZEL * 0.55), 2.0));
  colour -= crease * mix(0.055, 0.09, dark);

  gl_FragColor = vec4(colour * inside, inside);
}
`;
