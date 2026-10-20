import emblem from '../../assets/images/emblem.png';
import { cx } from '../../lib/cx';

// Full RoadWatch emblem (Figma 96:18). Navy backgrounds only.
// Pass decorative when the name "RoadWatch" is already given nearby.
export default function Emblem({ size = 160, decorative = false, className = '' }) {
  return (
    <img
      src={emblem}
      alt={decorative ? '' : 'RoadWatch, road safety and incident reporting'}
      width={size}
      height={size}
      className={cx('shrink-0 object-cover', className)}
      style={{ width: size, height: size }}
    />
  );
}
