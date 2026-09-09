/** Independent geometry fitted to the observed scroll checkpoints, not source shader code. */
export type SceneLayout = ReturnType<typeof sceneLayout>;
export const clamp = (v: number, low: number, high: number) =>
  Math.max(low, Math.min(high, v));
export function sceneLayout(width: number, height: number, count: number) {
  const mobile = width < 700;
  const columns = mobile ? 1 : 2;
  const margin = width * (mobile ? 0.06 : 0.1);
  const gap = mobile ? 0 : width / 36;
  const cardWidth = (width - margin * 2 - gap) / columns;
  const imageHeight = cardWidth / 1.9;
  const captionHeight = mobile ? 68 : 64;
  const rowGap = mobile ? 22 : 24;
  const pitch = imageHeight + captionHeight + rowGap;
  const firstTop = height * (mobile ? 0.26 : 0.34);
  const gate = mobile ? 168 : 218;
  // A shorter, more responsive pinned section on touch screens. The previous
  // value consumed roughly two full swipes for one visible transition.
  const gain = mobile ? 2.4 : 2;
  const pole = mobile ? 52 : 82;
  const rows = Math.ceil(count / columns);
  const travel = Math.max(
    0,
    (rows - 1) * pitch + firstTop + imageHeight - gate + 195,
  );
  return {
    width,
    height,
    mobile,
    columns,
    margin,
    gap,
    cardWidth,
    imageHeight,
    captionHeight,
    pitch,
    firstTop,
    gate,
    gain,
    pole,
    rows,
    travel,
    scrollLength: travel / gain,
  };
}
export function damp(
  current: number,
  target: number,
  elapsed: number,
  response = 155,
) {
  return (
    current +
    (target - current) * (1 - Math.exp(-Math.max(0, elapsed) / response))
  );
}
export function rowTop(layout: SceneLayout, index: number, distance: number) {
  return (
    layout.firstTop +
    Math.floor(index / layout.columns) * layout.pitch -
    distance
  );
}
export function rowOpacity(bottom: number, gate: number) {
  const p = clamp((gate - bottom - 80) / 115, 0, 1);
  return 1 - p * p * (3 - 2 * p);
}
