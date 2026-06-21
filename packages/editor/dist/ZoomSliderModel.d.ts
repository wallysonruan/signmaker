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
export declare function createZoomSliderModel(): ZoomSliderModel;
//# sourceMappingURL=ZoomSliderModel.d.ts.map