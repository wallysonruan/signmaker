import { VIEWPORT_MIN_ZOOM, VIEWPORT_MAX_ZOOM } from './Viewport';

const LOG_MIN = Math.log(VIEWPORT_MIN_ZOOM);
const LOG_MAX = Math.log(VIEWPORT_MAX_ZOOM);

export interface ZoomSliderModel {
  /** Map a zoom scale to a slider position in [0, 100]. */
  scaleToSlider(scale: number): number;
  /** Map a slider position in [0, 100] to a zoom scale. */
  sliderToScale(pos: number): number;
  /** Format a zoom scale as a percentage string, e.g. "125%". */
  formatScale(scale: number): string;
  atMin(scale: number): boolean;
  atMax(scale: number): boolean;
}

export function createZoomSliderModel(): ZoomSliderModel {
  return {
    scaleToSlider(scale: number): number {
      return ((Math.log(scale) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
    },
    sliderToScale(pos: number): number {
      return Math.exp(LOG_MIN + (pos / 100) * (LOG_MAX - LOG_MIN));
    },
    formatScale(scale: number): string {
      return `${Math.round(scale * 100)}%`;
    },
    atMin(scale: number): boolean {
      return scale <= VIEWPORT_MIN_ZOOM;
    },
    atMax(scale: number): boolean {
      return scale >= VIEWPORT_MAX_ZOOM;
    },
  };
}
