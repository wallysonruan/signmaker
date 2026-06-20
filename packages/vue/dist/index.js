import { Fragment as e, computed as t, createCommentVNode as n, createElementBlock as r, createElementVNode as i, createStaticVNode as a, createVNode as o, defineComponent as s, nextTick as c, normalizeClass as l, normalizeStyle as u, openBlock as d, ref as f, renderList as p, shallowRef as m, toDisplayString as h, triggerRef as g, unref as _, vModelText as v, watch as y, withDirectives as b, withKeys as x, withModifiers as S } from "vue";
import { DEFAULT_BINDINGS as C, EMPTY_STATE as w, INITIAL_PALETTE_NAV as T, actionToCommand as E, addSymbol as D, cancelDrag as O, copySelected as k, createCanvasScope as A, createCanvasScope as j, createCommandBus as M, createCommandBus as N, createDefaultHistory as P, createDefaultHistory as F, createFocusManager as I, createFocusManager as L, createMementoCommand as ee, createMementoCommand as te, createPaletteScope as ne, createPaletteScope as re, createScope as ie, createScope as ae, createScopeManager as oe, createScopeManager as se, createSignMaker as ce, createSignMaker as le, endDrag as ue, getSelected as R, lookupAction as z, mirrorSelected as B, paletteBack as V, paletteEnterBase as H, paletteEnterGroup as U, paletteSetVariantTab as de, rotateSelected as W, selectNone as fe, startDrag as pe, updateDrag as me } from "@signwriter/editor";
import { getSymbolSize as he, renderSymbol as G } from "@signwriter/renderer";
//#region src/useEditorState.ts
function ge(e = {}) {
	let n = e.history ?? F(w), r = m(n.current()), i = () => {
		r.value = n.current(), g(r);
	}, a = N({ apply(e, t) {
		return n.push(te(t, e)), i(), n.current();
	} }), o = t(() => r.value), s = t(() => (r.value, n.canUndo())), c = t(() => (r.value, n.canRedo()));
	function l(e) {
		a.dispatch("", e);
	}
	function u(e) {
		n.replace(e), i();
	}
	function d() {
		n.undo(), i();
	}
	function f() {
		n.redo(), i();
	}
	return {
		state: o,
		canUndo: s,
		canRedo: c,
		bus: a,
		history: n,
		dispatch: l,
		replaceState: u,
		undo: d,
		redo: f
	};
}
//#endregion
//#region src/useSymbolDrag.ts
function K(e, n, r) {
	let i = f(null), a = f(0), o = f(0), s = t(() => i.value !== null);
	function c(t, r, s) {
		let { editorState: c, drag: l } = pe(e(), t);
		i.value = l, a.value = r, o.value = s, n(c);
	}
	function l(e, t) {
		if (i.value === null) return;
		let n = e - a.value, r = t - o.value;
		i.value = me(i.value, n, r);
	}
	function u() {
		if (i.value === null) return;
		let e = i.value;
		i.value = null, r((t) => ue(t, e));
	}
	function d() {
		i.value !== null && (i.value = null, n(O(e())));
	}
	return {
		isDragging: s,
		onPointerDown: c,
		onPointerMove: l,
		onPointerUp: u,
		onPointerCancel: d
	};
}
//#endregion
//#region src/useKeyboard.ts
function _e(e, t, n) {
	function r(r) {
		function i(r) {
			let i = r, a = z(C, i.keyCode, i.shiftKey, i.ctrlKey);
			if (a === null) return;
			if ((i.keyCode === 8 || i.keyCode === 9 || i.keyCode === 191) && i.preventDefault(), a === "undo") {
				t();
				return;
			}
			if (a === "redo") {
				n();
				return;
			}
			let o = E(a);
			o !== null && e(o);
		}
		return r.addEventListener("keydown", i), () => {
			r.removeEventListener("keydown", i);
		};
	}
	return { attach: r };
}
//#endregion
//#region src/data/alphabet.ts
var q = {
	S10000: [
		"S10000",
		"S10110",
		"S10210",
		"S10310",
		"S10410",
		"S10510",
		"S10610",
		"S10710",
		"S10810",
		"S10910",
		"S10a10",
		"S10b10",
		"S10c10",
		"S10d10"
	],
	S10e00: [
		"S10e00",
		"S10f10",
		"S11010",
		"S11110",
		"S11210",
		"S11310",
		"S11410",
		"S11510",
		"S11610",
		"S11710",
		"S11810",
		"S11910",
		"S11a10",
		"S11b10",
		"S11c10",
		"S11d10"
	],
	S11e00: /* @__PURE__ */ "S11e00.S11f10.S12010.S12110.S12210.S12310.S12410.S12510.S12610.S12710.S12810.S12910.S12a10.S12b10.S12c10.S12d10.S12e10.S12f10.S13010.S13110.S13210.S13310.S13410.S13510.S13610.S13710.S13810.S13910.S13a10.S13b10.S13c10.S13d10.S13e10.S13f10.S14010.S14110.S14210.S14310".split("."),
	S14400: [
		"S14400",
		"S14510",
		"S14610",
		"S14710",
		"S14810",
		"S14910",
		"S14a10",
		"S14b10"
	],
	S14c00: /* @__PURE__ */ "S14c00.S14d10.S14e10.S14f10.S15010.S15110.S15210.S15310.S15410.S15510.S15610.S15710.S15810.S15910.S15a10.S15b10.S15c10.S15d10.S15e10.S15f10.S16010.S16110.S16210.S16310.S16410.S16510.S16610.S16710.S16810.S16910.S16a10.S16b10.S16c10.S16d10.S16e10.S16f10.S17010.S17110.S17210.S17310.S17410.S17510.S17610.S17710.S17810.S17910.S17a10.S17b10.S17c10.S17d10.S17e10.S17f10.S18010.S18110.S18210.S18310.S18410.S18510".split("."),
	S18600: /* @__PURE__ */ "S18600.S18710.S18810.S18910.S18a10.S18b10.S18c10.S18d10.S18e10.S18f10.S19010.S19110.S19210.S19310.S19410.S19510.S19610.S19710.S19810.S19910.S19a10.S19b10.S19c10.S19d10.S19e10.S19f10.S1a010.S1a110.S1a210.S1a310".split("."),
	S1a400: [
		"S1a400",
		"S1a510",
		"S1a610",
		"S1a710",
		"S1a810",
		"S1a910",
		"S1aa10",
		"S1ab10",
		"S1ac10",
		"S1ad10",
		"S1ae10",
		"S1af10",
		"S1b010",
		"S1b110",
		"S1b210",
		"S1b310",
		"S1b410",
		"S1b510",
		"S1b610",
		"S1b710",
		"S1b810",
		"S1b910"
	],
	S1ba00: [
		"S1ba00",
		"S1bb10",
		"S1bc10",
		"S1bd10",
		"S1be10",
		"S1bf10",
		"S1c010",
		"S1c110",
		"S1c210",
		"S1c310",
		"S1c410",
		"S1c510",
		"S1c610",
		"S1c710",
		"S1c810",
		"S1c910",
		"S1ca10",
		"S1cb10",
		"S1cc10"
	],
	S1cd00: /* @__PURE__ */ "S1cd00.S1ce10.S1cf10.S1d010.S1d110.S1d210.S1d310.S1d410.S1d510.S1d610.S1d710.S1d810.S1d910.S1da10.S1db10.S1dc10.S1dd10.S1de10.S1df10.S1e010.S1e110.S1e200.S1e310.S1e410.S1e510.S1e610.S1e710.S1e810.S1e910.S1ea10.S1eb10.S1ec10.S1ed10.S1ee10.S1ef10.S1f010.S1f110.S1f210.S1f310.S1f410".split("."),
	S1f500: [
		"S1f500",
		"S1f610",
		"S1f710",
		"S1f810",
		"S1f910",
		"S1fa10",
		"S1fb10",
		"S1fc10",
		"S1fd10",
		"S1fe10",
		"S1ff10",
		"S20010",
		"S20110",
		"S20210",
		"S20310",
		"S20410"
	],
	S20500: [
		"S20500",
		"S20600",
		"S20700",
		"S20800",
		"S20900",
		"S20a00",
		"S20b00",
		"S20c00",
		"S20d00",
		"S20e00",
		"S20f00",
		"S21000",
		"S21100",
		"S21200",
		"S21300",
		"S21400",
		"S21500"
	],
	S21600: [
		"S21600",
		"S21700",
		"S21800",
		"S21900",
		"S21a00",
		"S21b00",
		"S21c00",
		"S21d00",
		"S21e00",
		"S21f00",
		"S22000",
		"S22100",
		"S22200",
		"S22300",
		"S22400",
		"S22500",
		"S22600",
		"S22700",
		"S22800",
		"S22900"
	],
	S22a00: /* @__PURE__ */ "S22a00.S22b00.S22c00.S22d00.S22e00.S22f00.S23000.S23100.S23200.S23300.S23400.S23500.S23600.S23700.S23800.S23900.S23a00.S23b00.S23c00.S23d00.S23e00.S23f00.S24000.S24100.S24200.S24300.S24400.S24500.S24600.S24700.S24800.S24900.S24a00.S24b00.S24c00.S24d00.S24e00.S24f00.S25000.S25100.S25200.S25300.S25400".split("."),
	S25500: [
		"S25500",
		"S25600",
		"S25700",
		"S25800",
		"S25900",
		"S25a00",
		"S25b00",
		"S25c00",
		"S25d00",
		"S25e00",
		"S25f00",
		"S26000",
		"S26100",
		"S26200",
		"S26300",
		"S26400"
	],
	S26500: /* @__PURE__ */ "S26500.S26600.S26700.S26800.S26900.S26a00.S26b00.S26c00.S26d00.S26e00.S26f00.S27000.S27100.S27200.S27300.S27400.S27500.S27600.S27700.S27800.S27900.S27a00.S27b00.S27c00.S27d00.S27e00.S27f00.S28000.S28100.S28200.S28300.S28400.S28500.S28600.S28700".split("."),
	S28800: /* @__PURE__ */ "S28800.S28900.S28a00.S28b00.S28c00.S28d00.S28e00.S28f00.S29000.S29100.S29200.S29300.S29400.S29500.S29600.S29700.S29800.S29900.S29a00.S29b00.S29c00.S29d00.S29e00.S29f00.S2a000.S2a100.S2a200.S2a300.S2a400.S2a500".split("."),
	S2a600: [
		"S2a600",
		"S2a700",
		"S2a800",
		"S2a900",
		"S2aa00",
		"S2ab00",
		"S2ac00",
		"S2ad00",
		"S2ae00",
		"S2af00",
		"S2b000",
		"S2b100",
		"S2b200",
		"S2b300",
		"S2b400",
		"S2b500",
		"S2b600"
	],
	S2b700: /* @__PURE__ */ "S2b700.S2b800.S2b900.S2ba00.S2bb00.S2bc00.S2bd00.S2be00.S2bf00.S2c000.S2c100.S2c200.S2c300.S2c400.S2c500.S2c600.S2c700.S2c800.S2c900.S2ca00.S2cb00.S2cc00.S2cd00.S2ce00.S2cf00.S2d000.S2d100.S2d200.S2d300.S2d400".split("."),
	S2d500: [
		"S2d500",
		"S2d600",
		"S2d700",
		"S2d800",
		"S2d900",
		"S2da00",
		"S2db00",
		"S2dc00",
		"S2dd00",
		"S2de00",
		"S2df00",
		"S2e000",
		"S2e100",
		"S2e200"
	],
	S2e300: [
		"S2e300",
		"S2e400",
		"S2e500",
		"S2e600",
		"S2e700",
		"S2e800",
		"S2e900",
		"S2ea00",
		"S2eb00",
		"S2ec00",
		"S2ed00",
		"S2ee00",
		"S2ef00",
		"S2f000",
		"S2f100",
		"S2f200",
		"S2f300",
		"S2f400",
		"S2f500",
		"S2f600"
	],
	S2f700: [
		"S2f700",
		"S2f800",
		"S2f900",
		"S2fa00",
		"S2fb00",
		"S2fc00",
		"S2fd00",
		"S2fe00"
	],
	S2ff00: [
		"S2ff00",
		"S30000",
		"S30100",
		"S30200",
		"S30300",
		"S30400",
		"S30500",
		"S30600",
		"S30700",
		"S30800",
		"S30900"
	],
	S30a00: /* @__PURE__ */ "S30a00.S30b00.S30c00.S30d00.S30e00.S30f00.S31000.S31100.S31200.S31300.S31400.S31500.S31600.S31700.S31800.S31900.S31a00.S31b00.S31c00.S31d00.S31e00.S31f00.S32000.S32100.S32200.S32300.S32400.S32500.S32600.S32700.S32800.S32900".split("."),
	S32a00: [
		"S32a00",
		"S32b00",
		"S32c00",
		"S32d00",
		"S32e00",
		"S32f00",
		"S33000",
		"S33100",
		"S33200",
		"S33300",
		"S33400",
		"S33500",
		"S33600",
		"S33700",
		"S33800",
		"S33900",
		"S33a00"
	],
	S33b00: /* @__PURE__ */ "S33b00.S33c00.S33d00.S33e00.S33f00.S34000.S34100.S34200.S34300.S34400.S34500.S34600.S34700.S34800.S34900.S34a00.S34b00.S34c00.S34d00.S34e00.S34f00.S35000.S35100.S35200.S35300.S35400.S35500.S35600.S35700.S35800".split("."),
	S35900: [
		"S35900",
		"S35a00",
		"S35b00",
		"S35c00",
		"S35d00",
		"S35e00",
		"S35f00",
		"S36000",
		"S36100",
		"S36200",
		"S36300",
		"S36400",
		"S36500",
		"S36600",
		"S36700",
		"S36800",
		"S36900",
		"S36a00",
		"S36b00",
		"S36c00"
	],
	S36d00: [
		"S36d00",
		"S36e00",
		"S36f00",
		"S37000",
		"S37100",
		"S37200",
		"S37300",
		"S37400",
		"S37500"
	],
	S37600: [
		"S37600",
		"S37700",
		"S37800",
		"S37900",
		"S37a00",
		"S37b00",
		"S37c00",
		"S37d00",
		"S37e00"
	],
	S37f00: [
		"S37f00",
		"S38000",
		"S38100",
		"S38200",
		"S38300",
		"S38400",
		"S38500",
		"S38600"
	],
	S38700: [
		"S38700",
		"S38800",
		"S38900",
		"S38a00",
		"S38b00"
	]
}, J = Object.keys(q);
//#endregion
//#region src/usePaletteScope.ts
function Y(e, t) {
	return re({
		onAddSymbol: e,
		initialNav: t,
		itemsAt: (e) => e.level === "groups" ? J : e.level === "bases" && e.selectedGroup !== null ? q[e.selectedGroup] ?? [] : [],
		columnsAt: (e) => e.level === "variants" ? 8 : 4,
		itemCountAt: (e) => e.level === "variants" ? 48 : e.level === "groups" ? J.length : e.level === "bases" && e.selectedGroup !== null ? (q[e.selectedGroup] ?? []).length : 0
	});
}
//#endregion
//#region src/useScopeManager.ts
function X(e, n, r, i = {}) {
	let a = f(T), o = i.focusManager ?? L(), s = j({
		dispatch: e,
		onUndo: n,
		onRedo: r,
		bindings: i.canvasBindings
	}), c = ae("palette"), l = i.scopeManager ?? se();
	l.register(s), l.register(c);
	let u = f("canvas");
	l.onScopeChanged((e) => {
		(e === "palette" || e === "canvas") && (u.value = e), e !== null && o.focusScope(e);
	}), l.enter("canvas");
	let d = i.scopeSwitchBinding?.keyCode ?? 117;
	function p(e) {
		function t(e) {
			let t = e, n = t.target;
			if (n?.tagName === "INPUT" || n?.tagName === "TEXTAREA") return;
			if (t.keyCode === d && (i.scopeSwitchBinding?.shift ?? !1) === t.shiftKey && (i.scopeSwitchBinding?.ctrl ?? !1) === t.ctrlKey) {
				t.preventDefault(), l.enter(u.value === "canvas" ? "palette" : "canvas");
				return;
			}
			let r = {
				keyCode: t.keyCode,
				key: t.key,
				shiftKey: t.shiftKey,
				ctrlKey: t.ctrlKey,
				metaKey: t.metaKey
			};
			l.routeKey(r) && (t.keyCode === 8 || t.keyCode === 9 || t.keyCode === 191) && t.preventDefault();
		}
		return e.addEventListener("keydown", t), () => e.removeEventListener("keydown", t);
	}
	return {
		scope: t(() => u.value),
		paletteNav: a,
		manager: l,
		focusManager: o,
		attach: p
	};
}
//#endregion
//#region src/useSignMaker.ts
function ve(e = {}) {
	let { router: n, ...r } = e, i = le(r), a = m(i.getState()), o = () => {
		a.value = i.getState(), g(a);
	};
	i.history.onPush(o), i.history.onUndo(o), i.history.onRedo(o), i.history.onClear(o);
	let s = t(() => a.value), c = t(() => (a.value, i.canUndo())), l = t(() => (a.value, i.canRedo()));
	function u(e) {
		i.dispatch("", e);
	}
	function d(e) {
		i.replace(e), o();
	}
	function f() {
		i.undo();
	}
	function p() {
		i.redo();
	}
	let { scope: h, paletteNav: _, attach: v } = X(u, f, p, {
		scopeManager: i.scopeManager,
		focusManager: i.focusManager,
		...n
	});
	return {
		state: s,
		canUndo: c,
		canRedo: l,
		scope: h,
		paletteNav: _,
		bus: i.bus,
		history: i.history,
		scopeManager: i.scopeManager,
		focusManager: i.focusManager,
		signMaker: i,
		dispatch: u,
		replaceState: d,
		undo: f,
		redo: p,
		attach: v
	};
}
//#endregion
//#region src/components/SymbolPalette.vue?vue&type=script&setup=true&lang.ts
var ye = {
	key: 0,
	class: "palette-section"
}, be = ["aria-rowcount"], xe = [
	"title",
	"aria-label",
	"tabindex",
	"aria-selected",
	"onDragstart",
	"onClick",
	"onDblclick"
], Se = ["innerHTML"], Ce = {
	key: 1,
	class: "palette-section"
}, we = { class: "palette-nav" }, Te = {
	class: "palette-title",
	"aria-live": "polite"
}, Ee = ["aria-label", "aria-rowcount"], De = [
	"title",
	"aria-label",
	"tabindex",
	"aria-selected",
	"onDragstart",
	"onClick",
	"onDblclick"
], Oe = ["innerHTML"], ke = {
	key: 2,
	class: "palette-section"
}, Ae = { class: "palette-nav" }, je = {
	class: "palette-title",
	"aria-live": "polite"
}, Me = {
	class: "tab-bar",
	role: "tablist",
	"aria-label": "Rotation range"
}, Ne = ["aria-selected"], Pe = ["aria-selected"], Fe = ["aria-label"], Ie = [
	"title",
	"aria-label",
	"tabindex",
	"aria-selected",
	"onDragstart",
	"onClick"
], Z = ["innerHTML"], Le = /*@__PURE__*/ s({
	__name: "SymbolPalette",
	props: {
		nav: {},
		clickBehavior: {}
	},
	emits: ["add-symbol", "update:nav"],
	setup(a, { expose: o, emit: s }) {
		let u = a, m = s, g = f(null), v = f(T), y = t(() => u.nav ?? v.value);
		function b(e) {
			u.nav === void 0 ? v.value = e : m("update:nav", e), c(() => x());
		}
		function x() {
			if (!g.value) return !1;
			let e = g.value.querySelector("[tabindex=\"0\"]");
			return e ? (e.focus(), !0) : !1;
		}
		let C = Y((e) => m("add-symbol", e));
		C.onNavChanged((e) => b(e));
		let w = t(() => {
			let e = y.value;
			return e.level === "groups" ? J : e.level === "bases" && e.selectedGroup !== null ? q[e.selectedGroup] ?? [] : [];
		});
		function E(e) {
			return G(e);
		}
		function D(e, t, n) {
			return e.slice(0, 4) + t.toString() + n.toString(16);
		}
		function O(e) {
			(u.clickBehavior ?? "add") === "add" ? m("add-symbol", e) : y.value.level === "groups" ? b(U(y.value, e)) : y.value.level === "bases" && b(H(y.value, e));
		}
		function k(e, t) {
			(u.clickBehavior ?? "add") !== "navigate" && (y.value.level === "groups" ? b(U({
				...y.value,
				focusedIndex: e
			}, t)) : y.value.level === "bases" && b(H({
				...y.value,
				focusedIndex: e
			}, t)));
		}
		function A() {
			b(V(y.value));
		}
		function j(e) {
			b(de(y.value, e));
		}
		function M(e, t) {
			e.dataTransfer?.setData("text/plain", t), e.dataTransfer && (e.dataTransfer.effectAllowed = "copy");
		}
		function N(e) {
			C.setNav(y.value), C.scope.handleKey({
				keyCode: e.keyCode,
				key: e.key,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey
			}) && (e.preventDefault(), e.stopPropagation());
		}
		function P() {
			c(() => {
				x() || g.value?.focus();
			});
		}
		return o({ focus: P }), (t, a) => (d(), r("aside", {
			ref_key: "paletteEl",
			ref: g,
			class: "palette",
			role: "navigation",
			"aria-label": "Symbol palette",
			"data-palette": "",
			onKeydown: N
		}, [y.value.level === "groups" ? (d(), r("div", ye, [a[2] ||= i("div", {
			class: "palette-title",
			"aria-hidden": "true"
		}, "Symbol Groups", -1), i("div", {
			class: "group-grid",
			role: "grid",
			"aria-label": "Symbol groups",
			"aria-rowcount": Math.ceil(_(J).length / 4)
		}, [(d(!0), r(e, null, p(_(J), (e, t) => (d(), r("button", {
			key: e,
			class: "group-btn",
			title: e,
			"aria-label": e,
			tabindex: t === y.value.focusedIndex ? 0 : -1,
			"aria-selected": t === y.value.focusedIndex,
			draggable: "true",
			onDragstart: (t) => M(t, e),
			onClick: (t) => O(e),
			onDblclick: S((n) => k(t, e), ["prevent"])
		}, [i("span", {
			class: "symbol-cell",
			innerHTML: E(e),
			"aria-hidden": "true"
		}, null, 8, Se)], 40, xe))), 128))], 8, be)])) : y.value.level === "bases" && y.value.selectedGroup !== null ? (d(), r("div", Ce, [i("div", we, [i("button", {
			class: "back-btn",
			onClick: A
		}, "← Groups"), i("span", Te, h(y.value.selectedGroup), 1)]), i("div", {
			class: "symbol-grid",
			role: "grid",
			"aria-label": `Symbols in ${y.value.selectedGroup}`,
			"aria-rowcount": Math.ceil(w.value.length / 4)
		}, [(d(!0), r(e, null, p(w.value, (e, t) => (d(), r("button", {
			key: e,
			class: "symbol-btn",
			title: e,
			"aria-label": e,
			tabindex: t === y.value.focusedIndex ? 0 : -1,
			"aria-selected": t === y.value.focusedIndex,
			draggable: "true",
			onDragstart: (t) => M(t, e),
			onClick: (t) => O(e),
			onDblclick: S((n) => k(t, e), ["prevent"])
		}, [i("span", {
			class: "symbol-cell",
			innerHTML: E(e),
			"aria-hidden": "true"
		}, null, 8, Oe)], 40, De))), 128))], 8, Ee)])) : y.value.level === "variants" && y.value.selectedBase !== null ? (d(), r("div", ke, [
			i("div", Ae, [i("button", {
				class: "back-btn",
				onClick: A
			}, "← Base"), i("span", je, h(y.value.selectedBase), 1)]),
			i("div", Me, [i("button", {
				role: "tab",
				class: l(["tab-btn", { active: y.value.variantTab === "first" }]),
				"aria-selected": y.value.variantTab === "first",
				onClick: a[0] ||= (e) => j("first")
			}, "0–7", 10, Ne), i("button", {
				role: "tab",
				class: l(["tab-btn", { active: y.value.variantTab === "second" }]),
				"aria-selected": y.value.variantTab === "second",
				onClick: a[1] ||= (e) => j("second")
			}, "8–f", 10, Pe)]),
			i("div", {
				class: "variant-grid",
				role: "grid",
				"aria-label": `Variants for ${y.value.selectedBase}, rotations ${y.value.variantTab === "first" ? "0–7" : "8–f"}`,
				"aria-rowcount": "6"
			}, [(d(), r(e, null, p(6, (t) => (d(), r(e, { key: t }, [(d(), r(e, null, p(8, (e) => i("button", {
				key: e,
				class: "symbol-btn",
				title: D(y.value.selectedBase, t - 1, (y.value.variantTab === "second" ? 8 : 0) + e - 1),
				"aria-label": D(y.value.selectedBase, t - 1, (y.value.variantTab === "second" ? 8 : 0) + e - 1),
				tabindex: (t - 1) * 8 + (e - 1) === y.value.focusedIndex ? 0 : -1,
				"aria-selected": (t - 1) * 8 + (e - 1) === y.value.focusedIndex,
				draggable: "true",
				onDragstart: (n) => M(n, D(y.value.selectedBase, t - 1, (y.value.variantTab === "second" ? 8 : 0) + e - 1)),
				onClick: (n) => m("add-symbol", D(y.value.selectedBase, t - 1, (y.value.variantTab === "second" ? 8 : 0) + e - 1))
			}, [i("span", {
				class: "symbol-cell",
				innerHTML: E(D(y.value.selectedBase, t - 1, (y.value.variantTab === "second" ? 8 : 0) + e - 1)),
				"aria-hidden": "true"
			}, null, 8, Z)], 40, Ie)), 64))], 64))), 64))], 8, Fe)
		])) : n("", !0)], 544));
	}
}), Q = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, Re = /*#__PURE__*/ Q(Le, [["__scopeId", "data-v-ce98b47c"]]), $ = /*#__PURE__*/ Q(/* @__PURE__ */ s({
	__name: "SymbolHandles",
	props: {
		state: {},
		dispatch: { type: Function },
		midWidth: {},
		midHeight: {},
		isDragging: { type: Boolean }
	},
	setup(e) {
		let o = e, s = t(() => {
			if (o.isDragging) return null;
			let e = R(o.state);
			return e.length === 1 ? e[0] : null;
		}), c = t(() => {
			let e = s.value;
			if (!e) return null;
			let t = he(e.key) ?? {
				width: 40,
				height: 40
			};
			return {
				left: e.x - 500 + o.midWidth,
				top: e.y - 500 + o.midHeight,
				width: t.width,
				height: t.height
			};
		}), l = t(() => {
			let e = c.value;
			return e ? {
				position: "absolute",
				left: e.left + "px",
				top: e.top + "px",
				width: e.width + "px",
				height: e.height + "px",
				zIndex: "20",
				pointerEvents: "none"
			} : {};
		});
		function f() {
			o.dispatch(W(-1));
		}
		function p() {
			o.dispatch(W(1));
		}
		function m() {
			o.dispatch(B());
		}
		function h() {
			o.dispatch((e) => B()(W(4)(e)));
		}
		function g() {
			o.dispatch(k(() => crypto.randomUUID()));
		}
		return (e, t) => c.value ? (d(), r("div", {
			key: 0,
			class: "handles-root",
			style: u(l.value),
			onClick: t[0] ||= S(() => {}, ["stop"]),
			onPointerdown: t[1] ||= S(() => {}, ["stop"])
		}, [
			t[2] ||= a("<div class=\"handles-box\" data-v-26e112d3><span class=\"handle handle--tl\" data-v-26e112d3></span><span class=\"handle handle--tr\" data-v-26e112d3></span><span class=\"handle handle--bl\" data-v-26e112d3></span><span class=\"handle handle--br\" data-v-26e112d3></span></div>", 1),
			i("div", { class: "handles-toolbar handles-toolbar--top" }, [i("button", {
				class: "handle-btn",
				title: "Rotate counter-clockwise",
				onClick: f
			}, "↺"), i("button", {
				class: "handle-btn",
				title: "Rotate clockwise",
				onClick: p
			}, "↻")]),
			i("div", { class: "handles-toolbar handles-toolbar--bottom" }, [
				i("button", {
					class: "handle-btn",
					title: "Flip horizontal",
					onClick: m
				}, "⟺"),
				i("button", {
					class: "handle-btn",
					title: "Flip vertical",
					onClick: h
				}, "↕"),
				i("button", {
					class: "handle-btn handle-btn--copy",
					title: "Copy symbol",
					onClick: g
				}, "⊕")
			])
		], 36)) : n("", !0);
	}
}), [["__scopeId", "data-v-26e112d3"]]), ze = [
	"tabindex",
	"aria-label",
	"aria-selected",
	"onPointerdown"
], Be = ["innerHTML"], Ve = /*#__PURE__*/ Q(/* @__PURE__ */ s({
	__name: "SignEditorCanvas",
	props: {
		state: {},
		dispatch: { type: Function },
		replaceState: { type: Function }
	},
	setup(n, { expose: a }) {
		let s = n, c = f(null), m = f(null), h = t(() => c.value ? c.value.clientWidth / 2 : 300), g = t(() => c.value ? c.value.clientHeight / 2 : 250), v = f(null), b = f(null), x = K(() => s.state, (e) => s.replaceState(e), (e) => s.dispatch(e));
		function C(e) {
			return G(e);
		}
		function w(e) {
			let t = e.x, n = e.y;
			return v.value?.symbolId === e.id && (t += v.value.dx, n += v.value.dy), {
				position: "absolute",
				left: t - 500 + h.value + "px",
				top: n - 500 + g.value + "px",
				cursor: x.isDragging.value ? "grabbing" : "grab",
				zIndex: s.state.selection.has(e.id) ? "10" : "1"
			};
		}
		function T(e, t) {
			t.currentTarget.setPointerCapture(t.pointerId), t.stopPropagation(), b.value = {
				x: t.clientX,
				y: t.clientY
			}, v.value = {
				symbolId: e.id,
				dx: 0,
				dy: 0
			}, x.onPointerDown(e.id, t.clientX, t.clientY);
		}
		function E(e) {
			!v.value || !b.value || (v.value = {
				...v.value,
				dx: e.clientX - b.value.x,
				dy: e.clientY - b.value.y
			}, x.onPointerMove(e.clientX, e.clientY));
		}
		function O(e) {
			v.value = null, b.value = null, x.onPointerUp();
		}
		function k(e) {
			v.value = null, b.value = null, x.onPointerCancel();
		}
		function A(e) {
			s.dispatch((e) => fe(e));
		}
		function j(e) {
			e.preventDefault();
			let t = e.dataTransfer?.getData("text/plain");
			if (!t || !c.value) return;
			let n = c.value.getBoundingClientRect(), r = Math.round(e.clientX - n.left - h.value + 500), i = Math.round(e.clientY - n.top - g.value + 500);
			s.dispatch(D(t, r, i, () => crypto.randomUUID()));
		}
		function M(e) {
			m.value && (m.value.textContent = "", requestAnimationFrame(() => {
				m.value && (m.value.textContent = e);
			}));
		}
		y(() => s.state, (e, t) => {
			let n = e.symbols.length - t.symbols.length;
			if (n > 0) {
				let t = e.symbols[e.symbols.length - 1];
				M(`Symbol ${t?.key ?? ""} added`);
			} else if (n < 0) {
				let e = Math.abs(n);
				M(e === 1 ? "Symbol deleted" : `${e} symbols deleted`);
			} else if (e.selection.size !== t.selection.size) if (e.selection.size === 0) M("Selection cleared");
			else {
				let t = [...e.selection], n = e.symbols.find((e) => e.id === t[0]);
				M(n ? `${n.key} selected` : "Symbol selected");
			}
		}, { deep: !1 }), y(() => s.state.selection, (e) => {
			if (e.size !== 1 || !c.value) return;
			let t = c.value.querySelector("[aria-selected=\"true\"]");
			c.value.contains(document.activeElement) && t?.focus();
		}, { deep: !0 });
		function N() {
			(c.value?.querySelector("[aria-selected=\"true\"]") ?? c.value)?.focus();
		}
		return a({ focus: N }), (t, a) => (d(), r("div", {
			ref_key: "canvasEl",
			ref: c,
			class: "canvas",
			role: "region",
			"aria-label": "Sign canvas",
			tabindex: 0,
			"data-canvas": "",
			onClick: A,
			onPointermove: E,
			onPointerup: O,
			onPointercancel: k,
			onDragover: a[1] ||= S(() => {}, ["prevent"]),
			onDrop: j
		}, [
			(d(!0), r(e, null, p(n.state.symbols, (e) => (d(), r("div", {
				key: e.id,
				class: l(["symbol-wrapper", { selected: n.state.selection.has(e.id) }]),
				style: u(w(e)),
				tabindex: n.state.selection.has(e.id) ? 0 : -1,
				role: "img",
				"aria-label": `Symbol ${e.key}`,
				"aria-selected": n.state.selection.has(e.id),
				onPointerdown: (t) => T(e, t),
				onClick: a[0] ||= S(() => {}, ["stop"])
			}, [i("span", {
				innerHTML: C(e.key),
				"aria-hidden": "true"
			}, null, 8, Be)], 46, ze))), 128)),
			o($, {
				state: n.state,
				dispatch: n.dispatch,
				"mid-width": h.value,
				"mid-height": g.value,
				"is-dragging": _(x).isDragging.value
			}, null, 8, [
				"state",
				"dispatch",
				"mid-width",
				"mid-height",
				"is-dragging"
			]),
			i("div", {
				ref_key: "liveRegion",
				ref: m,
				class: "sr-only",
				role: "status",
				"aria-live": "polite",
				"aria-atomic": "true"
			}, null, 512)
		], 544));
	}
}), [["__scopeId", "data-v-5bcd2d64"]]), He = { class: "fsw-panel" }, Ue = { class: "fsw-current" }, We = { class: "fsw-input-group" }, Ge = /*#__PURE__*/ Q(/* @__PURE__ */ s({
	__name: "FswPanel",
	props: { fsw: {} },
	emits: ["load-fsw"],
	setup(e, { emit: t }) {
		let n = t, a = f("");
		function o() {
			let e = a.value.trim();
			e && (n("load-fsw", e), a.value = "");
		}
		return (t, n) => (d(), r("footer", He, [
			n[1] ||= i("span", { class: "fsw-label" }, "FSW:", -1),
			i("span", Ue, h(e.fsw || "(empty)"), 1),
			i("div", We, [b(i("input", {
				"onUpdate:modelValue": n[0] ||= (e) => a.value = e,
				class: "fsw-input",
				type: "text",
				placeholder: "Paste FSW to load a sign…",
				onKeydown: x(o, ["enter"])
			}, null, 544), [[v, a.value]]), i("button", {
				class: "fsw-load-btn",
				onClick: o
			}, "Load")])
		]));
	}
}), [["__scopeId", "data-v-393d8782"]]);
//#endregion
export { Ge as FswPanel, Ve as SignEditorCanvas, $ as SymbolHandles, Re as SymbolPalette, A as createCanvasScope, M as createCommandBus, P as createDefaultHistory, I as createFocusManager, ee as createMementoCommand, ne as createPaletteScope, ie as createScope, oe as createScopeManager, ce as createSignMaker, ge as useEditorState, _e as useKeyboard, Y as usePaletteScope, X as useScopeManager, ve as useSignMaker, K as useSymbolDrag };
