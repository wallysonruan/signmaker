import { createZoomSliderModel } from '../src/ZoomSliderModel';
import { VIEWPORT_MIN_ZOOM, VIEWPORT_MAX_ZOOM } from '../src/Viewport';

const model = createZoomSliderModel();

describe('createZoomSliderModel()', () => {
  describe('scaleToSlider()', () => {
    test('maps min zoom to 0', () => {
      expect(model.scaleToSlider(VIEWPORT_MIN_ZOOM)).toBeCloseTo(0);
    });

    test('maps max zoom to 100', () => {
      expect(model.scaleToSlider(VIEWPORT_MAX_ZOOM)).toBeCloseTo(100);
    });

    test('maps 1× (100 %) to the midpoint on a log scale', () => {
      const mid = model.scaleToSlider(1);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(100);
    });
  });

  describe('sliderToScale()', () => {
    test('maps 0 to min zoom', () => {
      expect(model.sliderToScale(0)).toBeCloseTo(VIEWPORT_MIN_ZOOM);
    });

    test('maps 100 to max zoom', () => {
      expect(model.sliderToScale(100)).toBeCloseTo(VIEWPORT_MAX_ZOOM);
    });

    test('round-trips with scaleToSlider', () => {
      const scales = [0.5, 1, 1.5, 2, 4];
      for (const s of scales) {
        expect(model.sliderToScale(model.scaleToSlider(s))).toBeCloseTo(s, 8);
      }
    });
  });

  describe('formatScale()', () => {
    test('formats 1 as "100%"', () => {
      expect(model.formatScale(1)).toBe('100%');
    });

    test('formats 0.5 as "50%"', () => {
      expect(model.formatScale(0.5)).toBe('50%');
    });

    test('rounds fractional percentages', () => {
      expect(model.formatScale(1.256)).toBe('126%');
    });
  });

  describe('atMin() / atMax()', () => {
    test('atMin is true at the minimum zoom', () => {
      expect(model.atMin(VIEWPORT_MIN_ZOOM)).toBe(true);
    });

    test('atMin is false above the minimum', () => {
      expect(model.atMin(1)).toBe(false);
    });

    test('atMax is true at the maximum zoom', () => {
      expect(model.atMax(VIEWPORT_MAX_ZOOM)).toBe(true);
    });

    test('atMax is false below the maximum', () => {
      expect(model.atMax(1)).toBe(false);
    });
  });
});
