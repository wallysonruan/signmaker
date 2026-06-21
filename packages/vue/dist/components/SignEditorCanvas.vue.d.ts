import { EditorState, Command } from '@signwriter/editor';
type __VLS_Props = {
    state: EditorState;
    dispatch: (command: Command) => void;
    replaceState: (state: EditorState) => void;
};
declare function dropSymbolAt(key: string, clientX: number, clientY: number): void;
/** Focus the canvas element (called by useScopeManager when entering canvas scope). */
declare function focus(): void;
declare const _default: import('vue').DefineComponent<__VLS_Props, {
    focus: typeof focus;
    dropSymbolAt: typeof dropSymbolAt;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    canvasEl: HTMLDivElement;
    scrollLayerEl: HTMLDivElement;
    liveRegion: HTMLDivElement;
}, HTMLDivElement>;
export default _default;
//# sourceMappingURL=SignEditorCanvas.vue.d.ts.map