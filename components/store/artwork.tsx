import s from "./store.module.css";
export function Artwork({
  name = "Make something great.",
  variant = 0,
}: {
  name?: string;
  variant?: number;
}) {
  return (
    <div
      className={`${s.artwork} ${s[`art${variant % 4}`]}`}
      aria-hidden="true"
    >
      <span className={s.artOrbit} />
      <span className={s.artGrid} />
      <strong>{name}</strong>
      <span className={s.artCaption}>Ideas, ready to use.</span>
    </div>
  );
}
