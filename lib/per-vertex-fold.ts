export const FOLD = { radius: 85, maxWrapAngle: Math.PI / 2, zGain: 1.25, perspective: 650, centerLift: 26 };
export type FoldOptions = typeof FOLD;

/** Immutable, centered source vertices; output positions never feed back here. */
export function createBasePositions(width: number, height: number, nx: number, ny: number) {
  const positions: number[] = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++)
    positions.push((i / nx - 0.5) * width, height / 2 - j / ny * height, 0);
  return Object.freeze(positions);
}

export type FoldPoint = { y: number; z: number; shade: number };
export type ProjectedPoint = { x: number; y: number; scale: number; depth: number };

// `out` is a caller-owned scratch object, mutated and returned. Called once per
// grid vertex per card per frame (thousands of times/frame); allocating a
// fresh object per call created enough garbage-collector pressure to make
// scrolling visibly stutter, especially on iOS.
export function foldVertex(out: FoldPoint, localY: number, layoutTop: number, distance: number, H: number, gateY: number, options = FOLD, u = 0) {
  const foldPointLocal = Math.max(0, Math.min(H, gateY - layoutTop + distance));
  // After M4 the entire sheet has passed the gate. Recede it as a whole
  // instead of letting its last vertex escape upward while fp stays clamped.
  const exitDistance = Math.max(0, gateY - layoutTop + distance - H);
  const naiveY = layoutTop - distance + localY + exitDistance;
  if (localY >= foldPointLocal) {
    out.y = naiveY;
    out.z = -exitDistance * options.zGain;
    out.shade = 1;
    return out;
  }
  const { radius, zGain } = options;
  const maxWrapAngle = Math.max(Math.PI / 2, Math.min(Math.PI, options.maxWrapAngle));
  const pastAmount = foldPointLocal - localY;
  const theta = Math.min(pastAmount / radius, maxWrapAngle);
  const extra = Math.max(0, pastAmount - radius * maxWrapAngle);
  const depthTangent = Math.max(0.15, Math.abs(Math.cos(maxWrapAngle)));
  // Lift the middle of the curled edge; keep both sides and the gate seam fixed.
  const centerLift = options.centerLift * Math.sin(Math.PI * u) ** 2 * (1 - Math.cos(theta));
  out.y = gateY + radius - radius * Math.cos(theta) + extra * Math.sin(maxWrapAngle) - centerLift;
  out.z = -radius * Math.sin(theta) * zGain - (extra * depthTangent + exitDistance) * zGain;
  out.shade = 1 - 0.18 * Math.sin(theta / 2);
  return out;
}

/** Screen Y points down; negative world Z is farther from the viewer. */
export function projectVertex(out: ProjectedPoint, x: number, y: number, z: number, centerX: number, gateY: number, perspective = FOLD.perspective) {
  const scale = perspective / (perspective + Math.max(0, -z));
  out.x = centerX + (x - centerX) * scale;
  out.y = gateY + (y - gateY) * scale;
  out.scale = scale;
  out.depth = 1 - scale;
  return out;
}
