import { PaletteNavigationState } from '@signwriter/editor';
type __VLS_Props = {
    /** External navigation state. When provided the component is controlled (model-style). */
    nav?: PaletteNavigationState;
    /** 'add' (default): single click adds to canvas; dblclick expands.
        'navigate': preserves legacy single-click drill-down. */
    clickBehavior?: 'add' | 'navigate';
};
/** Focus the palette root element (called by useScopeManager when entering palette scope). */
declare function focus(): void;
declare const _default: import('vue').DefineComponent<__VLS_Props, {
    focus: typeof focus;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "add-symbol": (key: string) => any;
    "palette-drop": (key: string, clientX: number, clientY: number) => any;
    "update:nav": (state: PaletteNavigationState) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onAdd-symbol"?: ((key: string) => any) | undefined;
    "onPalette-drop"?: ((key: string, clientX: number, clientY: number) => any) | undefined;
    "onUpdate:nav"?: ((state: PaletteNavigationState) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    paletteEl: HTMLElement;
}, HTMLElement>;
export default _default;
//# sourceMappingURL=SymbolPalette.vue.d.ts.map