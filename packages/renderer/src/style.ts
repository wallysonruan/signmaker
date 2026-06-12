import { compose } from '@sutton-signwriting/core/style';
import type { SignStyle, SymbolStyle } from './types';

/**
 * Build the FSW style suffix string (e.g. "-P10Z2G_blue_D_black,white_C")
 * from typed style options.
 *
 * Uses @sutton-signwriting/core's style.compose() which handles all
 * escaping and formatting for the FSW style sub-language.
 */
export function buildSignStyleSuffix(style?: SignStyle): string {
  if (!style) return '';

  const suffix = compose({
    padding:    style.padding,
    zoom:       style.zoom,
    background: style.background,
    colorize:   style.colorize,
    detail:     style.detail
                  ? style.detail.filter((c): c is string => c !== undefined)
                  : undefined,
  });
  // compose({}) returns "-" (bare prefix with no options); treat that as empty
  return suffix === '-' ? '' : suffix;
}

export function buildSymbolStyleSuffix(style?: SymbolStyle): string {
  if (!style) return '';
  return buildSignStyleSuffix({
    detail:     style.detail,
    background: style.background,
    colorize:   style.colorize,
  });
}
