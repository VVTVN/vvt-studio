export const FOLD = { radius: 85, maxWrapAngle: Math.PI / 2, zGain: 1.25, perspective: 650, centerLift: 26 };
export type FoldOptions = typeof FOLD;

/** Immutable, centered source vertices; output positions never feed back here. */
export function createBasePositions(width: number, height: number, nx: number, ny: number) {
  const positions: number[] = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++)
    positions.push((i / nx - 0.5) * width, height / 2 - j / ny * height, 0);
  return Object.freeze(positions);
}

export function foldVertex(localY: number, layoutTop: number, distance: number, H: number, gateY: number, options = FOLD, u = 0) {
  const foldPointLocal = Math.max(0, Math.min(H, gateY - layoutTop + distance));
  // After M4 the entire sheet has passed the gate. Recede it as a whole
  // instead of letting its last vertex escape upward while fp stays clamped.
  const exitDistance = Math.max(0, gateY - layoutTop + distance - H);
  const naiveY = layoutTop - distance + localY + exitDistance;
  if (localY >= foldPointLocal) return { y: naiveY, z: -exitDistance * options.zGain, shade: 1 };
  const { radius, zGain } = options;
  const maxWrapAngle = Math.max(Math.PI / 2, Math.min(Math.PI, options.maxWrapAngle));
  const pastAmount = foldPointLocal - localY;
  const theta = Math.min(pastAmount / radius, maxWrapAngle);
  const extra = Math.max(0, pastAmount - radius * maxWrapAngle);
  const depthTangent = Math.max(0.15, Math.abs(Math.cos(maxWrapAngle)));
  // Lift the middle of the curled edge; keep both sides and the gate seam fixed.
  const centerLift = options.centerLift * Math.sin(Math.PI * u) ** 2 * (1 - Math.cos(theta));
  return {
    y: gateY + radius - radius * Math.cos(theta) + extra * Math.sin(maxWrapAngle) - centerLift,
    z: -radius * Math.sin(theta) * zGain - (extra * depthTangent + exitDistance) * zGain,
    shade: 1 - 0.18 * Math.sin(theta / 2),
  };
}

/** Screen Y points down; negative world Z is farther from the viewer. */
export function projectVertex(x: number, y: number, z: number, centerX: number, gateY: number, perspective = FOLD.perspective) {
  const scale = perspective / (perspective + Math.max(0, -z));
  return { x: centerX + (x - centerX) * scale, y: gateY + (y - gateY) * scale, scale,
    depth: 1 - scale };
}
