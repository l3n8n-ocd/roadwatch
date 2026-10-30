import { BUILT_WITH } from '../../lib/builtWith';
import { cx } from '../../lib/cx';

// "Built with" logo grid (#49, Figma "Tool logo/*" tiles, W9 212:5835). One list per group; each tile is a
// decorative logo plus the visible tool name. One-color logos swap to their white version on dark surfaces
// (.rw-logo-light / .rw-logo-dark in index.css follow the theme, including the system setting).
// headingLevel: the group headings sit one level below the section title.
export default function BuiltWith({ headingLevel = 3, className = '' }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={cx('flex flex-col gap-6', className)}>
      {BUILT_WITH.map(({ group, tools }) => (
        <div key={group} className="flex flex-col gap-2">
          <Heading className="type-label text-text-muted">{group}</Heading>
          <ul className="flex flex-wrap gap-2 sm:gap-3">
            {tools.map((t) => (
              <li
                key={t.name}
                className="flex w-[calc((100%-16px)/3)] flex-col items-center gap-2 rounded-[12px] border border-border-subtle bg-surface-white px-2 py-3 sm:w-28"
              >
                <span className="flex h-8 w-full items-center justify-center">
                  <img src={t.src} alt="" className={cx('h-8 max-w-24 object-contain', t.darkSrc && 'rw-logo-light')} />
                  {t.darkSrc && <img src={t.darkSrc} alt="" className="rw-logo-dark h-8 max-w-24 object-contain" />}
                </span>
                <span className="text-center type-body-sm text-text-primary">{t.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
