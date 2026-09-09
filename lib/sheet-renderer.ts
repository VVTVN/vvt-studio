import {
  rowOpacity,
  type SceneLayout,
} from './scroll-geometry';
import { createBasePositions, foldVertex, projectVertex, FOLD, type FoldOptions } from './per-vertex-fold';

const VERTEX = `
attribute vec3 a_position;
attribute vec2 a_uv;
attribute float a_shade;
uniform vec2 u_viewport;
varying vec2 v_uv;
varying float v_shade;
varying float v_y;
void main() {
  gl_Position = vec4(a_position.x / u_viewport.x * 2.0 - 1.0, 1.0 - a_position.y / u_viewport.y * 2.0, a_position.z, 1.0);
  v_uv = a_uv; v_shade = a_shade; v_y = a_position.y;
}`;
const FRAGMENT = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_opacity;
uniform float u_clip;
varying vec2 v_uv;
varying float v_shade;
varying float v_y;
void main() {
  float fade = smoothstep(u_clip, u_clip + 20.0, v_y);
  if (fade < 0.02) discard;
  vec4 color = texture2D(u_image, v_uv);
  gl_FragColor = vec4(color.rgb * v_shade, color.a * u_opacity * fade);
}`;
const NX = 40,
  NY = 48;
export type Texture = WebGLTexture;
export class SheetRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private vertexBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;
  private values = new Float32Array((NX + 1) * (NY + 1) * 6);
  private indices: Uint16Array;
  private textures: WebGLTexture[] = [];
  private basePositions: readonly number[] = [];
  private wireBuffer: WebGLBuffer;
  private wireCount = 0;
  wireframe = false;
  foldOptions: FoldOptions = { ...FOLD };
  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    const compile = (kind: number, source: string) => {
      const shader = gl.createShader(kind)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || 'Shader compilation failed');
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX),
      fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error('Sheet renderer could not link');
    this.program = program;
    gl.useProgram(program);
    this.vertexBuffer = gl.createBuffer()!;
    this.indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.values.byteLength, gl.DYNAMIC_DRAW);
    const attributes = [
      ['a_position', 3, 0],
      ['a_uv', 2, 12],
      ['a_shade', 1, 20],
    ] as const;
    for (const [name, size, offset] of attributes) {
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 24, offset);
    }
    const idx: number[] = [];
    for (let y = 0; y < NY; y++)
      for (let x = 0; x < NX; x++) {
        const a = y * (NX + 1) + x,
          b = a + 1,
          c = a + NX + 1,
          d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    this.indices = new Uint16Array(idx);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    this.wireBuffer = gl.createBuffer()!;
    const lines: number[] = [];
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const a = j * (NX + 1) + i;
      if (i < NX) lines.push(a, a + 1);
      if (j < NY) lines.push(a, a + NX + 1);
    }
    this.wireCount = lines.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }
  resize(layout: SceneLayout) {
    this.basePositions = createBasePositions(layout.cardWidth, layout.imageHeight, NX, NY);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.round(layout.width * ratio);
    this.canvas.height = Math.round(layout.height * ratio);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(
      this.gl.getUniformLocation(this.program, 'u_viewport'),
      layout.width,
      layout.height,
    );
  }
  texture(
    image: HTMLImageElement,
    card: HTMLElement,
    layout: SceneLayout,
  ): Texture {
    const surface = document.createElement('canvas');
    const ratio = 2;
    surface.width = Math.round(layout.cardWidth * ratio);
    surface.height = Math.round(layout.imageHeight * ratio);
    const ctx = surface.getContext('2d')!;
    ctx.scale(ratio, ratio);
    const w = layout.cardWidth,
      h = layout.imageHeight;
    const cover = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const iw = image.naturalWidth * cover,
      ih = image.naturalHeight * cover;
    // Cover is resolved once per resize. Scrolling never re-crops or re-scales the image.
    ctx.filter = 'saturate(.75)';
    ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
    ctx.filter = 'none';
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0,0,0,.12)');
    gradient.addColorStop(0.3, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (const selector of ['.image-index', '.image-wordmark']) {
      const el = card.querySelector<HTMLElement>(selector);
      if (!el) continue;
      const style = getComputedStyle(el);
      ctx.fillStyle = style.color;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.textBaseline = 'top';
      const left = parseFloat(style.left) || 0;
      const y =
        selector === '.image-index'
          ? parseFloat(style.top) || 0
          : h - (parseFloat(style.bottom) || 0) - parseFloat(style.fontSize);
      // Canvas letter spacing preserves the existing wordmark typography where supported.
      if ('letterSpacing' in ctx)
        ctx.letterSpacing =
          style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
      ctx.fillText(el.textContent || '', left, y);
    }
    const gl = this.gl,
      texture = gl.createTexture()!;
    this.textures.push(texture);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      surface,
    );
    return texture;
  }
  clearTextures() {
    for (const t of this.textures) this.gl.deleteTexture(t);
    this.textures = [];
  }
  begin() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
  draw(
    texture: Texture,
    index: number,
    layoutTop: number,
    distance: number,
    layout: SceneLayout,
    motion: boolean,
    time = 0,
  ) {
    const top = layoutTop - distance;
    const gl = this.gl,
      opacity = rowOpacity(top + layout.imageHeight, layout.gate);
    if (opacity <= 0 || top > layout.height + 80)
      return { top, bottom: top + layout.imageHeight, opacity: 0 };
    // Keep depth across cards so a pulled-back sheet stays behind the next one.
    const x =
      layout.margin +
      (index % layout.columns) * (layout.cardWidth + layout.gap);
    let pos = 0,
      low = Infinity,
      high = -Infinity;
    for (let j = 0; j <= NY; j++)
      for (let i = 0; i <= NX; i++) {
        const u = i / NX,
          v = j / NY,
          baseOffset = (j * (NX + 1) + i) * 3,
          localY = layout.imageHeight / 2 - this.basePositions[baseOffset + 1],
          p = motion
            ? foldVertex(localY, layoutTop, distance, layout.imageHeight, layout.gate, this.foldOptions, u)
            : { y: top + localY, z: 0, shade: 1 };
        const foldedLength = Math.max(0, Math.min(layout.imageHeight, layout.gate - layoutTop + distance));
        const past = Math.max(0, foldedLength - localY);
        const ramp = Math.min(1, past / 85);
        const free = motion ? ramp * ramp * (3 - 2 * ramp) : 0;
        const t = time * 0.001;
        const wave = Math.sin(u * Math.PI * 2 - t * 1.7 + index * 0.8)
          + 0.35 * Math.sin(u * Math.PI * 3 + localY * 0.025 + t * 2.1);
        // Only loose, already folded material flutters. The fold seam stays pinned.
        const flutter = wave * free;
        p.y += flutter * Math.min(8, Math.max(0, p.y - layout.gate) * 0.3);
        p.z += flutter * Math.min(14, Math.max(0, -p.z) * 0.25);
        p.shade += flutter * 0.025;
        const unfolded = motion && localY >= foldedLength;
        // Broad swells move the image edges too; only an active fold seam is pinned.
        const waterEdge = 0.4 + 0.6 * Math.sin(Math.PI * u) ** 2;
        const seamRamp = foldedLength > 0 ? Math.min(1, Math.max(0, localY - foldedLength) / 45) : 1;
        const seamFade = seamRamp * seamRamp * (3 - 2 * seamRamp);
        const water = unfolded ? waterEdge * seamFade * (
          Math.sin(u * 4.5 + v * 2.5 - t * 1.15 + index * 0.7)
          + 0.3 * Math.sin(v * 5 - u * 3 + t * 0.75)
        ) : 0;
        p.y += water * 4.5;
        if (unfolded) p.z -= (water + 1.3 * waterEdge * seamFade) * 5;
        p.shade += water * 0.015;
        // Bend the silhouette itself as the sheet approaches the fold zone.
        const approach = Math.max(0, Math.min(1, (layout.gate + 180 - top) / 180));
        const softness = motion ? approach * approach * (3 - 2 * approach) : 0;
        const topBand = Math.exp(-localY / 55);
        const edge = 2 * u - 1;
        const corner = Math.abs(edge) ** 12;
        const bias = index % layout.columns === 0 ? 1 : -1;
        const bend = (12 * Math.sin(Math.PI * u) ** 2
          + 5 * bias * edge + 3 * Math.sin(u * 4 + t * 0.8 + index)) * topBand;
        const cornerTurn = 18 * corner * topBand;
        p.y += softness * (bend + cornerTurn);
        const worldX = x + layout.cardWidth / 2 + this.basePositions[baseOffset]
          + flutter * 3 + water * 0.6 - softness * edge * corner * topBand * 12;
        const drawn = projectVertex(worldX, p.y, p.z, layout.width / 2, layout.gate, this.foldOptions.perspective);
        this.values[pos++] = drawn.x;
        this.values[pos++] = drawn.y;
        this.values[pos++] = drawn.depth;
        this.values[pos++] = u;
        this.values[pos++] = v;
        this.values[pos++] = p.shade;
        low = Math.min(low, drawn.y);
        high = Math.max(high, drawn.y);
      }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.values);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_opacity'), opacity);
    gl.uniform1f(this.gl.getUniformLocation(this.program, 'u_clip'), -80);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframe ? this.wireBuffer : this.indexBuffer);
    gl.drawElements(this.wireframe ? gl.LINES : gl.TRIANGLES, this.wireframe ? this.wireCount : this.indices.length, gl.UNSIGNED_SHORT, 0);
    this.canvas.dataset.glError = String(gl.getError());
    return { top: low, bottom: high, opacity };
  }
  dispose() {
    this.clearTextures();
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteBuffer(this.indexBuffer);
    this.gl.deleteBuffer(this.wireBuffer);
    this.gl.deleteProgram(this.program);
  }
}

