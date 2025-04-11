/**
 * Tests modified from Angular shadow_css tests
 * https://github.com/angular/angular/blob/0f5c70d563b6943623a5940036a52fe077ad3fac/packages/compiler/test/shadow_css_spec.ts
 */

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { scopeCss } from '../shadow-css';

const exampleComponentCss = "@charset \"UTF-8\";:host{display:block}.x7f9d2e .sc-k8j2m4-h{display:block}.x7f9d2e [clamp].sc-k8j2m4-h{min-width:0}.x7f9d2e .sc-k8j2m4-h{--font-family-text:Helvetica, sans-serif}@supports (font-variation-settings: normal){.x7f9d2e .sc-k8j2m4-h{--font-family-text:Bull VF, Helvetica, sans-serif}}.x7f9d2e .sc-k8j2m4-h:lang(ja){--font-family-text:Noto Sans JP, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(ar){--font-family-text:Noto Kufi Arabic, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(ko){--font-family-text:Noto Sans KR, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(hi){--font-family-text:Noto Sans, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(he){--font-family-text:Noto Sans Hebrew, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(ka){--font-family-text:Noto Sans Georgian, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(th){--font-family-text:Noto Sans Thai, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(zh){--font-family-text:Microsoft YaHei, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, Hiragino Kaku Gothic ProN W3, Osaka, メイリオ, Meiryo, ＭＳ Ｐゴシック, MS PGothic, Arial Unicode MS, Tahoma, Helvetica, sans-serif}.x7f9d2e .sc-k8j2m4-h:lang(zh-Hant){--font-family-text:Microsoft JhengHei, Geneva CY, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, Hiragino Kaku Gothic ProN W3, Osaka, メイリオ, Meiryo, ＭＳ Ｐゴシック, MS PGothic, Arial Unicode MS, Tahoma, Helvetica, sans-serif}@supports (font-variation-settings: normal){.x7f9d2e .sc-k8j2m4-s>strong,.x7f9d2e .sc-k8j2m4-s>b{font-variation-settings:\"opsz\" 12, \"wght\" 700}}.x7f9d2e .a9b3c7{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;color:var(--text-color, #000F1E);font-family:var(--text-font-family, var(--font-family-text));font-style:var(--text-font-style, inherit);font-variant-numeric:tabular-nums;font-variation-settings:\"opsz\" 12, \"wght\" 400;font-weight:var(--text-font-weight, 400);letter-spacing:var(--text-letter-spacing, inherit);line-height:var(--text-line-height, 1.5);margin:0;text-transform:var(--text-text-transform, var(--text-transform, inherit))}.x7f9d2e .f3d8e1{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.x7f9d2e .b7c4d9{-webkit-box-orient:vertical;display:-webkit-box;-webkit-line-clamp:var(--text-clamp-length);overflow:hidden}.x7f9d2e .a9b3c7--size-xx-small{font-size:var(--text-font-size, calc(12rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.25);margin-bottom:0.333333em;padding-top:0.666667em}@media (min-width: 380px){.x7f9d2e .a9b3c7--size-xx-small{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16))))}}.x7f9d2e .a9b3c7--size-x-small{font-size:var(--text-font-size, calc(14rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.357143);margin-bottom:0.428571em;padding-top:0.714286em}@media (min-width: 380px){.x7f9d2e .a9b3c7--size-x-small{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16))))}}.x7f9d2e .a9b3c7--size-small{font-size:var(--text-font-size, calc(17rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.411765);margin-bottom:0.470588em;padding-top:0.705882em}@media (min-width: 380px){.x7f9d2e .a9b3c7--size-small{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media (min-width: 1200px){.x7f9d2e .a9b3c7--size-small{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16))))}}.x7f9d2e .a9b3c7--size-medium{font-size:var(--text-font-size, calc(18rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.5);margin-bottom:0.4em;padding-top:0.6em}@media (min-width: 380px){.x7f9d2e .a9b3c7--size-medium{font-size:calc(1 * var(--text-font-size, calc(18rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium{font-size:calc(1 * var(--text-font-size, calc(20rem / var(--base-font-size, 16))))}}.x7f9d2e .a9b3c7--size-large{font-size:var(--text-font-size, calc(22rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.333333);margin-bottom:0.5em;padding-top:1.083333em}@media (min-width: 380px){.x7f9d2e .a9b3c7--size-large{font-size:calc(1 * var(--text-font-size, calc(22rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media (min-width: 1200px){.x7f9d2e .a9b3c7--size-large{font-size:calc(1 * var(--text-font-size, calc(24rem / var(--base-font-size, 16))))}}.x7f9d2e .a9b3c7--size-x-large{font-size:var(--text-font-size, calc(26rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.137931);margin-bottom:0.413793em;padding-top:1.103448em}@media (min-width: 380px){.x7f9d2e .a9b3c7--size-x-large{font-size:calc(1 * var(--text-font-size, calc(26rem / var(--base-font-size, 16) + 3 * (100vw - 380px) / 820)))}}@media (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large{font-size:calc(1 * var(--text-font-size, calc(29rem / var(--base-font-size, 16))))}}@media screen and (min-width: 0){.x7f9d2e .a9b3c7--size-xx-small\\@small{font-size:var(--text-font-size, calc(12rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.25);margin-bottom:0.333333em;padding-top:0.666667em}}@media screen and (min-width: 0) and (min-width: 380px){.x7f9d2e .a9b3c7--size-xx-small\\@small{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 0) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small\\@small{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16))))}}@media screen and (min-width: 0){.x7f9d2e .a9b3c7--size-x-small\\@small{font-size:var(--text-font-size, calc(14rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.357143);margin-bottom:0.428571em;padding-top:0.714286em}}@media screen and (min-width: 0) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-small\\@small{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 0) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small\\@small{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16))))}}@media screen and (min-width: 0){.x7f9d2e .a9b3c7--size-small\\@small{font-size:var(--text-font-size, calc(17rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.411765);margin-bottom:0.470588em;padding-top:0.705882em}}@media screen and (min-width: 0) and (min-width: 380px){.x7f9d2e .a9b3c7--size-small\\@small{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 0) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-small\\@small{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16))))}}@media screen and (min-width: 0){.x7f9d2e .a9b3c7--size-medium\\@small{font-size:var(--text-font-size, calc(18rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.5);margin-bottom:0.4em;padding-top:0.6em}}@media screen and (min-width: 0) and (min-width: 380px){.x7f9d2e .a9b3c7--size-medium\\@small{font-size:calc(1 * var(--text-font-size, calc(18rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 0) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium\\@small{font-size:calc(1 * var(--text-font-size, calc(20rem / var(--base-font-size, 16))))}}@media screen and (min-width: 0){.x7f9d2e .a9b3c7--size-large\\@small{font-size:var(--text-font-size, calc(22rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.333333);margin-bottom:0.5em;padding-top:1.083333em}}@media screen and (min-width: 0) and (min-width: 380px){.x7f9d2e .a9b3c7--size-large\\@small{font-size:calc(1 * var(--text-font-size, calc(22rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 0) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-large\\@small{font-size:calc(1 * var(--text-font-size, calc(24rem / var(--base-font-size, 16))))}}@media screen and (min-width: 0){.x7f9d2e .a9b3c7--size-x-large\\@small{font-size:var(--text-font-size, calc(26rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.137931);margin-bottom:0.413793em;padding-top:1.103448em}}@media screen and (min-width: 0) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-large\\@small{font-size:calc(1 * var(--text-font-size, calc(26rem / var(--base-font-size, 16) + 3 * (100vw - 380px) / 820)))}}@media screen and (min-width: 0) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large\\@small{font-size:calc(1 * var(--text-font-size, calc(29rem / var(--base-font-size, 16))))}}@media screen and (min-width: 650px){.x7f9d2e .a9b3c7--size-xx-small\\@medium{font-size:var(--text-font-size, calc(12rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.25);margin-bottom:0.333333em;padding-top:0.666667em}}@media screen and (min-width: 650px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-xx-small\\@medium{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 650px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small\\@medium{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16))))}}@media screen and (min-width: 650px){.x7f9d2e .a9b3c7--size-x-small\\@medium{font-size:var(--text-font-size, calc(14rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.357143);margin-bottom:0.428571em;padding-top:0.714286em}}@media screen and (min-width: 650px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-small\\@medium{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 650px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small\\@medium{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16))))}}@media screen and (min-width: 650px){.x7f9d2e .a9b3c7--size-small\\@medium{font-size:var(--text-font-size, calc(17rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.411765);margin-bottom:0.470588em;padding-top:0.705882em}}@media screen and (min-width: 650px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-small\\@medium{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 650px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-small\\@medium{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16))))}}@media screen and (min-width: 650px){.x7f9d2e .a9b3c7--size-medium\\@medium{font-size:var(--text-font-size, calc(18rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.5);margin-bottom:0.4em;padding-top:0.6em}}@media screen and (min-width: 650px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-medium\\@medium{font-size:calc(1 * var(--text-font-size, calc(18rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 650px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium\\@medium{font-size:calc(1 * var(--text-font-size, calc(20rem / var(--base-font-size, 16))))}}@media screen and (min-width: 650px){.x7f9d2e .a9b3c7--size-large\\@medium{font-size:var(--text-font-size, calc(22rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.333333);margin-bottom:0.5em;padding-top:1.083333em}}@media screen and (min-width: 650px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-large\\@medium{font-size:calc(1 * var(--text-font-size, calc(22rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 650px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-large\\@medium{font-size:calc(1 * var(--text-font-size, calc(24rem / var(--base-font-size, 16))))}}@media screen and (min-width: 650px){.x7f9d2e .a9b3c7--size-x-large\\@medium{font-size:var(--text-font-size, calc(26rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.137931);margin-bottom:0.413793em;padding-top:1.103448em}}@media screen and (min-width: 650px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-large\\@medium{font-size:calc(1 * var(--text-font-size, calc(26rem / var(--base-font-size, 16) + 3 * (100vw - 380px) / 820)))}}@media screen and (min-width: 650px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large\\@medium{font-size:calc(1 * var(--text-font-size, calc(29rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1000px){.x7f9d2e .a9b3c7--size-xx-small\\@large{font-size:var(--text-font-size, calc(12rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.25);margin-bottom:0.333333em;padding-top:0.666667em}}@media screen and (min-width: 1000px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-xx-small\\@large{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1000px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small\\@large{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1000px){.x7f9d2e .a9b3c7--size-x-small\\@large{font-size:var(--text-font-size, calc(14rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.357143);margin-bottom:0.428571em;padding-top:0.714286em}}@media screen and (min-width: 1000px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-small\\@large{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1000px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small\\@large{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1000px){.x7f9d2e .a9b3c7--size-small\\@large{font-size:var(--text-font-size, calc(17rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.411765);margin-bottom:0.470588em;padding-top:0.705882em}}@media screen and (min-width: 1000px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-small\\@large{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1000px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-small\\@large{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1000px){.x7f9d2e .a9b3c7--size-medium\\@large{font-size:var(--text-font-size, calc(18rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.5);margin-bottom:0.4em;padding-top:0.6em}}@media screen and (min-width: 1000px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-medium\\@large{font-size:calc(1 * var(--text-font-size, calc(18rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1000px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium\\@large{font-size:calc(1 * var(--text-font-size, calc(20rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1000px){.x7f9d2e .a9b3c7--size-large\\@large{font-size:var(--text-font-size, calc(22rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.333333);margin-bottom:0.5em;padding-top:1.083333em}}@media screen and (min-width: 1000px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-large\\@large{font-size:calc(1 * var(--text-font-size, calc(22rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1000px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-large\\@large{font-size:calc(1 * var(--text-font-size, calc(24rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1000px){.x7f9d2e .a9b3c7--size-x-large\\@large{font-size:var(--text-font-size, calc(26rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.137931);margin-bottom:0.413793em;padding-top:1.103448em}}@media screen and (min-width: 1000px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-large\\@large{font-size:calc(1 * var(--text-font-size, calc(26rem / var(--base-font-size, 16) + 3 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1000px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large\\@large{font-size:calc(1 * var(--text-font-size, calc(29rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small\\@x-large{font-size:var(--text-font-size, calc(12rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.25);margin-bottom:0.333333em;padding-top:0.666667em}}@media screen and (min-width: 1200px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-xx-small\\@x-large{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1200px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small\\@x-large{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small\\@x-large{font-size:var(--text-font-size, calc(14rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.357143);margin-bottom:0.428571em;padding-top:0.714286em}}@media screen and (min-width: 1200px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-small\\@x-large{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1200px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small\\@x-large{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1200px){.x7f9d2e .a9b3c7--size-small\\@x-large{font-size:var(--text-font-size, calc(17rem / var(--base-font-size, 16)));line-height:var --text-line-height, 1.411765;margin-bottom:0.470588em;padding-top:0.705882em}}@media screen and (min-width: 1200px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-small\\@x-large{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1200px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-small\\@x-large{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium\\@x-large{font-size:var(--text-font-size, calc(18rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.5);margin-bottom:0.4em;padding-top:0.6em}}@media screen and (min-width: 1200px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-medium\\@x-large{font-size:calc(1 * var(--text-font-size, calc(18rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1200px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium\\@x-large{font-size:calc(1 * var(--text-font-size, calc(20rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1200px){.x7f9d2e .a9b3c7--size-large\\@x-large{font-size:var(--text-font-size, calc(22rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.333333);margin-bottom:0.5em;padding-top:1.083333em}}@media screen and (min-width: 1200px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-large\\@x-large{font-size:calc(1 * var(--text-font-size, calc(22rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1200px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-large\\@x-large{font-size:calc(1 * var(--text-font-size, calc(24rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large\\@x-large{font-size:var(--text-font-size, calc(26rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.137931);margin-bottom:0.413793em;padding-top:1.103448em}}@media screen and (min-width: 1200px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-large\\@x-large{font-size:calc(1 * var(--text-font-size, calc(26rem / var(--base-font-size, 16) + 3 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1200px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large\\@x-large{font-size:calc(1 * var(--text-font-size, calc(29rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1350px){.x7f9d2e .a9b3c7--size-xx-small\\@xx-large{font-size:var(--text-font-size, calc(12rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.25);margin-bottom:0.333333em;padding-top:0.666667em}}@media screen and (min-width: 1350px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-xx-small\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1350px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-xx-small\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(12rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1350px){.x7f9d2e .a9b3c7--size-x-small\\@xx-large{font-size:var(--text-font-size, calc(14rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.357143);margin-bottom:0.428571em;padding-top:0.714286em}}@media screen and (min-width: 1350px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-small\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1350px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-small\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(14rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1350px){.x7f9d2e .a9b3c7--size-small\\@xx-large{font-size:var(--text-font-size, calc(17rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.411765);margin-bottom:0.470588em;padding-top:0.705882em}}@media screen and (min-width: 1350px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-small\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16) + 0 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1350px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-small\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(17rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1350px){.x7f9d2e .a9b3c7--size-medium\\@xx-large{font-size:var(--text-font-size, calc(18rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.5);margin-bottom:0.4em;padding-top:0.6em}}@media screen and (min-width: 1350px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-medium\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(18rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1350px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-medium\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(20rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1350px){.x7f9d2e .a9b3c7--size-large\\@xx-large{font-size:var(--text-font-size, calc(22rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.333333);margin-bottom:0.5em;padding-top:1.083333em}}@media screen and (min-width: 1350px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-large\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(22rem / var(--base-font-size, 16) + 2 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1350px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-large\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(24rem / var(--base-font-size, 16))))}}@media screen and (min-width: 1350px){.x7f9d2e .a9b3c7--size-x-large\\@xx-large{font-size:var(--text-font-size, calc(26rem / var(--base-font-size, 16)));line-height:var(--text-line-height, 1.137931);margin-bottom:0.413793em;padding-top:1.103448em}}@media screen and (min-width: 1350px) and (min-width: 380px){.x7f9d2e .a9b3c7--size-x-large\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(26rem / var(--base-font-size, 16) + 3 * (100vw - 380px) / 820)))}}@media screen and (min-width: 1350px) and (min-width: 1200px){.x7f9d2e .a9b3c7--size-x-large\\@xx-large{font-size:calc(1 * var(--text-font-size, calc(29rem / var(--base-font-size, 16))))}}.x7f9d2e .a9b3c7--spacing-none{margin-bottom:0;padding-top:0}.x7f9d2e .a9b3c7--spacing-long-form-bottom{padding-top:0}.x7f9d2e .a9b3c7--spacing-long-form-top{margin-bottom:0}.x7f9d2e .h2j5k8{font-variation-settings:\"opsz\" 12, \"wght\" 500;font-weight:var(--text-font-weight, 500)}.x7f9d2e .m4n7p2{font-variation-settings:\"opsz\" 12, \"wght\" 700;font-weight:var(--text-font-weight, 700)}.x7f9d2e .q8r5t3.w6x9y4{color:var(--text-color, #FFFFFF)}.x7f9d2e .u1v4w7{color:var(--text-color, rgba(0, 15, 30, 0.6))}.x7f9d2e .u1v4w7.w6x9y4{color:var(--text-color, rgba(255, 255, 255, 0.6))}";

describe('scopeCSS', function () {
  function s(cssText: string, scopeId: string, commentOriginalSelector = false) {
    const shim = scopeCss(cssText, scopeId, commentOriginalSelector);

    const nlRegexp = /\n/g;
    return normalizeCSS(shim.replace(nlRegexp, ''));
  }

  it('should handle empty string', () => {
    expect(s('', 'a')).toEqual('');
  });

  it('should handle empty string, commented org selector', () => {
    expect(s('', 'a', true)).toEqual('');
  });

  it('div', () => {
    const r = s('div {}', 'sc-ion-tag', true);
    expect(r).toEqual('/*!@div*/div.sc-ion-tag {}');
  });

  it('should add an attribute to every rule, commented org selector', () => {
    const css = 'one {color: red;}two {color: red;}';
    const expected = '/*!@one*/one.a {color:red;}/*!@two*/two.a {color:red;}';
    expect(s(css, 'a', true)).toEqual(expected);
  });

  it('should add an attribute to every rule', () => {
    const css = 'one {color: red;}two {color: red;}';
    const expected = 'one.a {color:red;}two.a {color:red;}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should handle invalid css', () => {
    const css = 'one {color: red;}garbage';
    const expected = 'one.a {color:red;}garbage';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should add an attribute to every selector', () => {
    const css = 'one, two {color: red;}';
    const expected = 'one.a, two.a {color:red;}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should support newlines in the selector and content', () => {
    const css = 'one, \ntwo {\ncolor: red;}';
    const expected = 'one.a, two.a {color:red;}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should handle media rules', () => {
    const css = '@media screen and (max-width:800px, max-height:100%) {div {font-size:50px;}}';
    const expected = '@media screen and (max-width:800px, max-height:100%) {div.a {font-size:50px;}}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should handle page rules', () => {
    const css = '@page {div {font-size:50px;}}';
    const expected = '@page {div.a {font-size:50px;}}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should handle document rules', () => {
    const css = '@document url(http://www.w3.org/) {div {font-size:50px;}}';
    const expected = '@document url(http://www.w3.org/) {div.a {font-size:50px;}}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should handle media rules with simple rules', () => {
    const css = '@media screen and (max-width: 800px) {div {font-size: 50px;}} div {}';
    const expected = '@media screen and (max-width:800px) {div.a {font-size:50px;}} div.a {}';
    expect(s(css, 'a')).toEqual(expected);
  });

  it('should handle support rules', () => {
    const css = '@supports (display: flex) {section {display: flex;}}';
    const expected = '@supports (display:flex) {section.a {display:flex;}}';
    expect(s(css, 'a')).toEqual(expected);
  });

  // Check that the browser supports un-prefixed CSS animation
  it('should handle keyframes rules', () => {
    const css = '@keyframes foo {0% {transform:translate(-50%) scaleX(0);}}';
    expect(s(css, 'a')).toEqual(css);
  });

  it('should handle -webkit-keyframes rules', () => {
    const css = '@-webkit-keyframes foo {0% {-webkit-transform:translate(-50%) scaleX(0);}}';
    expect(s(css, 'a')).toEqual(css);
  });

  it('should perform relative fast', () => {
    const now = Date.now()
    scopeCss(exampleComponentCss, 'a', true);
    expect(Date.now() - now).toBeLessThan(10)
  })

  it('should handle complicated selectors', () => {
    expect(s('one::before {}', 'a')).toEqual('one.a::before {}');
    expect(s('one two {}', 'a')).toEqual('one.a two.a {}');
    expect(s('one > two {}', 'a')).toEqual('one.a > two.a {}');
    expect(s('one + two {}', 'a')).toEqual('one.a + two.a {}');
    expect(s('one ~ two {}', 'a')).toEqual('one.a ~ two.a {}');
    const res = s('.one.two > three {}', 'a'); // IE swap classes
    expect(res === '.one.two.a > three.a {}' || res === '.two.one.a > three.a {}').toEqual(true);
    expect(s('one[attr="value"] {}', 'a')).toEqual('one[attr="value"].a {}');
    expect(s('one[attr=value] {}', 'a')).toEqual('one[attr="value"].a {}');
    expect(s('one[attr^="value"] {}', 'a')).toEqual('one[attr^="value"].a {}');
    expect(s('one[attr$="value"] {}', 'a')).toEqual('one[attr$="value"].a {}');
    expect(s('one[attr*="value"] {}', 'a')).toEqual('one[attr*="value"].a {}');
    expect(s('one[attr|="value"] {}', 'a')).toEqual('one[attr|="value"].a {}');
    expect(s('one[attr~="value"] {}', 'a')).toEqual('one[attr~="value"].a {}');
    expect(s('one[attr="va lue"] {}', 'a')).toEqual('one[attr="va lue"].a {}');
    expect(s('one[attr] {}', 'a')).toEqual('one[attr].a {}');
    expect(s('[is="one"] {}', 'a')).toEqual('[is="one"].a {}');
  });

  it('should handle escaped ":" in selector', () => {
    expect(s('\\:one {}', 'a')).toEqual('\\:one.a {}');
    expect(s('one\\:two {}', 'a')).toEqual('one\\:two.a {}');
    expect(s('one\\:two:hover {}', 'a')).toEqual('one\\:two.a:hover {}');
    expect(s('one\\:two::before {}', 'a')).toEqual('one\\:two.a::before {}');
    expect(s('one\\:two::before:hover {}', 'a')).toEqual('one\\:two.a::before:hover {}');
    expect(s('one\\:two:not(.three\\:four) {}', 'a')).toEqual('one\\:two.a:not(.three\\:four) {}');
  });

  describe(':host', () => {
    it('should handle no context', () => {
      expect(s(':host {}', 'a')).toEqual('.a-h {}');
    });

    it('should handle tag selector', () => {
      expect(s(':host(ul) {}', 'a')).toEqual('ul.a-h {}');
    });

    it('should handle class selector', () => {
      expect(s(':host(.x) {}', 'a')).toEqual('.x.a-h {}');
    });

    it('should handle attribute selector', () => {
      expect(s(':host([a="b"]) {}', 'a')).toEqual('[a="b"].a-h {}');
      expect(s(':host([a=b]) {}', 'a')).toEqual('[a="b"].a-h {}');
    });

    it('should handle multiple tag selectors', () => {
      expect(s(':host(ul,li) {}', 'a')).toEqual('ul.a-h, li.a-h {}');
      expect(s(':host(ul,li) > .z {}', 'a')).toEqual('ul.a-h > .z.a, li.a-h > .z.a {}');
    });

    it('should handle multiple class selectors', () => {
      expect(s(':host(.x,.y) {}', 'a')).toEqual('.x.a-h, .y.a-h {}');
      expect(s(':host(.x,.y) > .z {}', 'a')).toEqual('.x.a-h > .z.a, .y.a-h > .z.a {}');
    });

    it('should handle multiple attribute selectors', () => {
      expect(s(':host([a="b"],[c=d]) {}', 'a')).toEqual('[a="b"].a-h, [c="d"].a-h {}');
    });

    it('should handle pseudo selectors', () => {
      expect(s(':host(:before) {}', 'a')).toEqual('.a-h:before {}');
      expect(s(':host:before {}', 'a')).toEqual('.a-h:before {}');
      expect(s(':host:nth-child(8n+1) {}', 'a')).toEqual('.a-h:nth-child(8n+1) {}');
      expect(s(':host:nth-of-type(8n+1) {}', 'a')).toEqual('.a-h:nth-of-type(8n+1) {}');
      expect(s(':host(.class):before {}', 'a')).toEqual('.class.a-h:before {}');
      expect(s(':host.class:before {}', 'a')).toEqual('.class.a-h:before {}');
      expect(s(':host(:not(p)):before {}', 'a')).toEqual('.a-h:not(p):before {}');
    });

    it('should not replace the selector in a `@supports` rule', () => {
      expect(s('@supports selector(:host()) {:host {color: red; }}', 'a')).toEqual(
        '@supports selector(:host()) {.a-h {color:red;}}',
      );
    });
  });

  describe(':host-context', () => {
    it('should handle tag selector', () => {
      expect(s(':host-context(div) {}', 'a')).toEqual('div.a-h, div .a-h {}');
      expect(s(':host-context(ul) > .y {}', 'a')).toEqual('ul.a-h > .y.a, ul .a-h > .y.a {}');
    });

    it('should handle class selector', () => {
      expect(s(':host-context(.x) {}', 'a')).toEqual('.x.a-h, .x .a-h {}');

      expect(s(':host-context(.x) > .y {}', 'a')).toEqual('.x.a-h > .y.a, .x .a-h > .y.a {}');
    });

    it('should handle attribute selector', () => {
      expect(s(':host-context([a="b"]) {}', 'a')).toEqual('[a="b"].a-h, [a="b"] .a-h {}');
      expect(s(':host-context([a=b]) {}', 'a')).toEqual('[a=b].a-h, [a="b"] .a-h {}');
    });

    it('should not replace the selector in a `@supports` rule', () => {
      expect(s('@supports selector(:host-context(.class1)) {:host-context(.class1) {color: red; }}', 'a')).toEqual(
        '@supports selector(:host-context(.class1)) {.class1.a-h, .class1 .a-h {color:red;}}',
      );
    });
    ``;
  });

  describe('::slotted', () => {
    it('should handle *', () => {
      const r = s('::slotted(*) {}', 'sc-ion-tag');
      expect(r).toEqual('.sc-ion-tag-s > * {}');
    });

    it('should handle * descendant', () => {
      const r = s('::slotted(*) .my-class {}', 'sc-ion-tag');
      expect(r).toEqual('.sc-ion-tag-s .my-class {}');
    });

    it('should handle :host complex selector', () => {
      const r = s(':host > ::slotted(*:nth-of-type(2n - 1)) {}', 'sc-ion-tag');
      expect(r).toEqual(
        '.sc-ion-tag-h >.sc-ion-tag-s > *:nth-of-type(2n - 1), .sc-ion-tag-h > .sc-ion-tag-s > *:nth-of-type(2n - 1) {}',
      );
    });

    it('should handle host-context complex selector', () => {
      const r = s(':host-context(.red) > ::slotted(*:nth-of-type(2n - 1)) {}', 'sc-ion-tag');
      expect(r).toEqual(
        '.sc-ion-tag-h.red >.sc-ion-tag-s > *:nth-of-type(2n - 1), .sc-ion-tag-h.red > .sc-ion-tag-s > *:nth-of-type(2n - 1), .red .sc-ion-tag-h >.sc-ion-tag-s > *:nth-of-type(2n - 1), .red .sc-ion-tag-h > .sc-ion-tag-s > *:nth-of-type(2n - 1) {}',
      );
    });

    it('should handle left side selector', () => {
      const r = s('div::slotted(ul) {}', 'sc-ion-tag');
      expect(r).toEqual('div.sc-ion-tag-s > ul {}');
    });

    it('should handle tag selector', () => {
      const r = s('::slotted(ul) {}', 'sc-ion-tag');
      expect(r).toEqual('.sc-ion-tag-s > ul {}');
    });

    it('should handle class selector', () => {
      const r = s('::slotted(.foo) {}', 'sc-ion-tag');
      expect(r).toEqual('.sc-ion-tag-s > .foo {}');
    });

    it('should handle multiple selector', () => {
      const r = s('::slotted(ul), ::slotted(li) {}', 'sc-ion-tag');
      expect(r).toEqual('.sc-ion-tag-s > ul, .sc-ion-tag-s > li {}');
    });

    it('should combine parent selector', () => {
      const r = s('div{} .a .b .c ::slotted(*) {}', 'sc-ion-tag');
      expect(r).toEqual('div.sc-ion-tag{} .a .b .c.sc-ion-tag-s > *, .a .b .c .sc-ion-tag-s > * {}');
    });

    it('same selectors', () => {
      const r = s('::slotted(*) {}, ::slotted(*) {}, ::slotted(*) {}', 'sc-ion-tag');
      expect(r).toEqual('.sc-ion-tag-s > * {}, .sc-ion-tag-s > * {}, .sc-ion-tag-s > * {}');
    });

    it('should combine parent selector when comma', () => {
      const r = s('.a .b, .c ::slotted(*) {}', 'sc-ion-tag');
      expect(r).toEqual('.a.sc-ion-tag .b.sc-ion-tag, .c.sc-ion-tag-s > *, .c .sc-ion-tag-s > * {}');
    });

    it('should not replace the selector in a `@supports` rule', () => {
      expect(s('@supports selector(::slotted(*)) {::slotted(*) {color: red; }}', 'sc-cmp')).toEqual(
        '@supports selector(::slotted(*)) {.sc-cmp-s > * {color:red;}}',
      );
    });
  });

  it('should handle ::shadow', () => {
    const css = s('x::shadow > y {}', 'a');
    expect(css).toEqual('x.a > y.a {}');
  });

  it('should pass through @import directives', () => {
    const styleStr = '@import url("https://fonts.googleapis.com/css?family=Roboto");';
    const css = s(styleStr, 'a');
    expect(css).toEqual(styleStr);
  });

  it('should shim rules after @import', () => {
    const styleStr = '@import url("a"); div {}';
    const css = s(styleStr, 'a');
    expect(css).toEqual('@import url("a"); div.a {}');
  });

  it('should leave calc() unchanged', () => {
    const styleStr = 'div {height:calc(100% - 55px);}';
    const css = s(styleStr, 'a');
    expect(css).toEqual('div.a {height:calc(100% - 55px);}');
  });

  it('should strip comments', () => {
    expect(s('/* x */b {c}', 'a')).toEqual('b.a {c}');
  });

  it('should ignore special characters in comments', () => {
    expect(s('/* {;, */b {c}', 'a')).toEqual('b.a {c}');
  });

  it('should support multiline comments', () => {
    expect(s('/* \n */b {c}', 'a')).toEqual('b.a {c}');
  });

  it('should keep sourceMappingURL comments', () => {
    expect(s('b {c}/*# sourceMappingURL=data:x */', 'a')).toEqual('b.a {c}/*# sourceMappingURL=data:x */');
    expect(s('b {c}/* #sourceMappingURL=data:x */', 'a')).toEqual('b.a {c}/* #sourceMappingURL=data:x */');
  });

  function normalizeCSS(css: string): string {
    return css
      .replace(/\s+/g, ' ')
      .replace(/:\s/g, ':')
      .replace(/'/g, '"')
      .replace(/ }/g, '}')
      .replace(/url\((\"|\s)(.+)(\"|\s)\)(\s*)/g, (...match: string[]) => `url("${match[2]}")`)
      .replace(/\[(.+)=([^"\]]+)\]/g, (...match: string[]) => `[${match[1]}="${match[2]}"]`);
  }
});
