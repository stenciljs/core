# Test Apps

`npm run build`


## Hello World App

`hello-world/www/build`

| File                                     | Brotli   | Gzipped  | Minified |
|------------------------------------------|----------|----------|----------|
| app-hash-hash.js                         | -        | 49B      | 29B      |
| hello-world.entry.js                     | 154B     | 181B     | 195B     |
| helloworld.esm.js                        | 201B     | 236B     | 307B     |
| helloworld.js                            | 1.32KB   | 1.76KB   | 5.19KB   |
| index-hash.js                            | 5.17KB   | 5.74KB   | 13.19KB  |
| **TOTAL**                                | 6.83KB   | 7.95KB   | 18.90KB  |



## Hello VDOM App

`hello-vdom/www/build`

| File                                     | Brotli   | Gzipped  | Minified |
|------------------------------------------|----------|----------|----------|
| app-hash-hash.js                         | -        | 49B      | 29B      |
| index-hash.js                            | 3.33KB   | 3.72KB   | 8.18KB   |
| **TOTAL**                                | 3.33KB   | 3.77KB   | 8.21KB   |



## Todo App

`todo-app/www/build`

| File                                     | Brotli   | Gzipped  | Minified |
|------------------------------------------|----------|----------|----------|
| app-hash-hash.js                         | -        | 49B      | 29B      |
| app-root_3.entry.js                      | 946B     | 1.08KB   | 2.09KB   |
| app.esm.js                               | 242B     | 279B     | 384B     |
| app.js                                   | 1.32KB   | 1.75KB   | 5.17KB   |
| index-hash.js                            | 4.77KB   | 5.38KB   | 11.82KB  |
| **TOTAL**                                | 7.26KB   | 8.53KB   | 19.48KB  |



## End-to-end App

`end-to-end/www/build`

| File                                     | Brotli   | Gzipped  | Minified |
|------------------------------------------|----------|----------|----------|
| another-car-detail.entry.js              | 263B     | 306B     | 438B     |
| another-car-list.entry.js                | 412B     | 502B     | 817B     |
| app-root_2.entry.js                      | 173.09KB | 208.28KB | 732.02KB |
| build-data.entry.js                      | 307B     | 358B     | 494B     |
| car-detail.entry.js                      | 267B     | 315B     | 457B     |
| car-list.entry.js                        | 433B     | 526B     | 871B     |
| cmp-a.entry.js                           | 299B     | 338B     | 424B     |
| cmp-b.entry.js                           | 299B     | 337B     | 424B     |
| cmp-c.entry.js                           | 230B     | 265B     | 302B     |
| cmp-dsd-focus.entry.js                   | 294B     | 347B     | 439B     |
| cmp-dsd.entry.js                         | 283B     | 358B     | 499B     |
| cmp-server-vs-client.entry.js            | 247B     | 287B     | 351B     |
| cmp-with-slot.entry.js                   | 277B     | 320B     | 412B     |
| dsd-listen-cmp.entry.js                  | 312B     | 365B     | 469B     |
| element-cmp.entry.js                     | 257B     | 303B     | 423B     |
| empty-cmp-shadow.entry.js                | 192B     | 241B     | 268B     |
| empty-cmp.entry.js                       | 189B     | 229B     | 254B     |
| endtoend.esm.js                          | 1.16KB   | 1.33KB   | 3.71KB   |
| env-data.entry.js                        | 264B     | 310B     | 379B     |
| event-cmp.entry.js                       | 231B     | 274B     | 518B     |
| hydrated-sibling-accessors.entry.js      | 338B     | 401B     | 575B     |
| import-assets.entry.js                   | 1.28KB   | 1.38KB   | 2.12KB   |
| index-hash.js                            | 13.10KB  | 14.63KB  | 41.69KB  |
| index.esm.js                             | -        | 58B      | 38B      |
| listen-cmp.entry.js                      | 147B     | 180B     | 207B     |
| method-cmp.entry.js                      | 180B     | 203B     | 254B     |
| my-cmp.entry.js                          | 307B     | 350B     | 472B     |
| my-jsx-cmp.entry.js                      | 205B     | 245B     | 284B     |
| nested-cmp-child.entry.js                | 264B     | 308B     | 374B     |
| nested-cmp-parent.entry.js               | 303B     | 353B     | 448B     |
| nested-scope-cmp.entry.js                | 266B     | 311B     | 389B     |
| non-shadow-child.entry.js                | 450B     | 512B     | 776B     |
| non-shadow-forwarded-slot.entry.js       | 479B     | 567B     | 941B     |
| non-shadow-multi-slots.entry.js          | 396B     | 474B     | 719B     |
| non-shadow-wrapper.entry.js              | 436B     | 509B     | 799B     |
| p-hash.js                                | 1.16KB   | 1.33KB   | 3.71KB   |
| path-alias-cmp.entry.js                  | 198B     | 233B     | 254B     |
| prerender-cmp.entry.js                   | 805B     | 997B     | 1.61KB   |
| resolve-var-events.entry.js              | 356B     | 405B     | 729B     |
| runtime-decorators.entry.js              | 890B     | 1012B    | 2.13KB   |
| scoped-car-detail.entry.js               | 258B     | 301B     | 434B     |
| scoped-car-list.entry.js                 | 423B     | 519B     | 893B     |
| shadow-child.entry.js                    | 442B     | 533B     | 801B     |
| shadow-wrapper.entry.js                  | 434B     | 498B     | 762B     |
| slot-cmp-container.entry.js              | 459B     | 529B     | 828B     |
| slot-cmp.entry.js                        | 245B     | 287B     | 335B     |
| slot-parent-cmp.entry.js                 | 288B     | 304B     | 377B     |
| state-cmp.entry.js                       | 414B     | 487B     | 721B     |
| **TOTAL**                                | 203.48KB | 243.10KB | 807.15KB |



## Ionic App

`ionic-app/www/build`

| File                                     | Brotli   | Gzipped  | Minified |
|------------------------------------------|----------|----------|----------|
| animation-hash-MS.js                     | 3.82KB   | 4.34KB   | 15.14KB  |
| app-home.entry.js                        | 656B     | 781B     | 1.38KB   |
| app-profile.entry.js                     | 713B     | 821B     | 1.52KB   |
| app-root_20.entry.js                     | 33.80KB  | 41.12KB  | 181.89KB |
| app.esm.js                               | 4.59KB   | 5.24KB   | 21.76KB  |
| app.js                                   | 1.32KB   | 1.75KB   | 5.17KB   |
| cubic-hash-hash.js                       | 812B     | 926B     | 2.09KB   |
| dir-hash-yF.js                           | 220B     | 268B     | 407B     |
| focus-hash-hash.js                       | 482B     | 560B     | 1.35KB   |
| framework-hash-hash.js                   | 930B     | 1.09KB   | 2.82KB   |
| gesture-hash-hash.js                     | 902B     | 1.01KB   | 3.40KB   |
| haptic-hash.js                           | 464B     | 525B     | 1.66KB   |
| hardware-hash-hash-hash.js               | 663B     | 855B     | 1.77KB   |
| helpers-hash.js                          | 1.87KB   | 2.19KB   | 5.61KB   |
| index-hash.js                            | 1.05KB   | 1.25KB   | 3.06KB   |
| index-hash.js                            | 1.57KB   | 1.82KB   | 4.78KB   |
| index-hash.js                            | 2.39KB   | 2.73KB   | 7.16KB   |
| index-hash.js                            | 16.75KB  | 19.21KB  | 72.44KB  |
| index-hash.js                            | 1.01KB   | 1.15KB   | 5.35KB   |
| input-hash-hash-F.js                     | 2.95KB   | 3.45KB   | 9.49KB   |
| ion-accordion-group.entry.js             | 1.54KB   | 1.76KB   | 6.34KB   |
| ion-accordion.entry.js                   | 2.52KB   | 2.93KB   | 10.77KB  |
| ion-action-sheet_3.entry.js              | 9.13KB   | 10.61KB  | 62.82KB  |
| ion-avatar.entry.js                      | 274B     | 324B     | 728B     |
| ion-back-button_2.entry.js               | 4.09KB   | 4.72KB   | 25.12KB  |
| ion-badge.entry.js                       | 540B     | 678B     | 2.47KB   |
| ion-breadcrumb.entry.js                  | 2.04KB   | 2.39KB   | 11.29KB  |
| ion-breadcrumbs.entry.js                 | 1.38KB   | 1.60KB   | 5.28KB   |
| ion-button_2.entry.js                    | 3.71KB   | 4.38KB   | 26.61KB  |
| ion-card-content.entry.js                | 479B     | 587B     | 2.25KB   |
| ion-card-header.entry.js                 | 650B     | 792B     | 2.02KB   |
| ion-card-subtitle.entry.js               | 412B     | 496B     | 1.09KB   |
| ion-card-title.entry.js                  | 392B     | 467B     | 1.07KB   |
| ion-card.entry.js                        | 1.27KB   | 1.52KB   | 5.20KB   |
| ion-checkbox_3.entry.js                  | 3.63KB   | 4.22KB   | 20.10KB  |
| ion-chip.entry.js                        | 1015B    | 1.22KB   | 7.89KB   |
| ion-col.entry.js                         | 1.41KB   | 1.66KB   | 7.30KB   |
| ion-datetime.entry.js                    | 14.55KB  | 16.99KB  | 73.75KB  |
| ion-fab-button.entry.js                  | 2.49KB   | 2.92KB   | 15.26KB  |
| ion-fab-list.entry.js                    | 838B     | 978B     | 3.14KB   |
| ion-fab.entry.js                         | 884B     | 1.01KB   | 2.81KB   |
| ion-footer.entry.js                      | 1.41KB   | 1.67KB   | 3.93KB   |
| ion-grid.entry.js                        | 641B     | 799B     | 4.97KB   |
| ion-img.entry.js                         | 839B     | 1014B    | 2.39KB   |
| ion-infinite-scroll-content.entry.js     | 702B     | 821B     | 3.46KB   |
| ion-infinite-scroll.entry.js             | 1.79KB   | 2.16KB   | 6.23KB   |
| ion-input.entry.js                       | 3.66KB   | 4.35KB   | 17.33KB  |
| ion-item-divider.entry.js                | 1.49KB   | 1.75KB   | 9.99KB   |
| ion-item-group.entry.js                  | 236B     | 280B     | 472B     |
| ion-item-option.entry.js                 | 1.31KB   | 1.60KB   | 8.23KB   |
| ion-item-options.entry.js                | 876B     | 1.02KB   | 5.06KB   |
| ion-item-sliding.entry.js                | 2.71KB   | 3.15KB   | 10.34KB  |
| ion-loading.entry.js                     | 2.25KB   | 2.64KB   | 10.20KB  |
| ion-menu-button.entry.js                 | 1.52KB   | 1.82KB   | 7.60KB   |
| ion-modal.entry.js                       | 7.59KB   | 8.82KB   | 35.64KB  |
| ion-nav-link.entry.js                    | 420B     | 500B     | 1.06KB   |
| ion-picker-column-internal_2.entry.js    | 5.57KB   | 6.54KB   | 25.99KB  |
| ion-picker-column.entry.js               | 3.02KB   | 3.48KB   | 11.40KB  |
| ion-picker.entry.js                      | 2.91KB   | 3.42KB   | 14.90KB  |
| ion-popover.entry.js                     | 8.50KB   | 9.82KB   | 38.10KB  |
| ion-progress-bar.entry.js                | 1.73KB   | 2.05KB   | 10.16KB  |
| ion-range.entry.js                       | 4.43KB   | 5.04KB   | 21.17KB  |
| ion-refresher-content.entry.js           | 583B     | 658B     | 1.94KB   |
| ion-refresher.entry.js                   | 6.76KB   | 7.75KB   | 32.90KB  |
| ion-reorder-group.entry.js               | 2.13KB   | 2.43KB   | 6.66KB   |
| ion-reorder.entry.js                     | 438B     | 551B     | 1.07KB   |
| ion-route-redirect.entry.js              | 222B     | 251B     | 500B     |
| ion-router-link.entry.js                 | 511B     | 615B     | 1.21KB   |
| ion-router-outlet.entry.js               | 1.71KB   | 1.97KB   | 5.59KB   |
| ion-row.entry.js                         | 195B     | 212B     | 280B     |
| ion-searchbar.entry.js                   | 4.53KB   | 5.31KB   | 26.48KB  |
| ion-segment-button.entry.js              | 2.70KB   | 3.12KB   | 19.08KB  |
| ion-segment.entry.js                     | 3.21KB   | 3.71KB   | 11.85KB  |
| ion-select-option.entry.js               | 326B     | 377B     | 633B     |
| ion-select.entry.js                      | 3.96KB   | 4.54KB   | 16.54KB  |
| ion-skeleton-text.entry.js               | 645B     | 757B     | 1.61KB   |
| ion-slide.entry.js                       | 295B     | 376B     | 695B     |
| ion-slides.entry.js                      | 5.20KB   | 6.22KB   | 51.44KB  |
| ion-spinner.entry.js                     | 1.21KB   | 1.34KB   | 4.15KB   |
| ion-tab-bar.entry.js                     | 1.23KB   | 1.48KB   | 6.11KB   |
| ion-tab-button.entry.js                  | 2.12KB   | 2.50KB   | 13.62KB  |
| ion-tab.entry.js                         | 558B     | 644B     | 1.32KB   |
| ion-tabs.entry.js                        | 1.13KB   | 1.33KB   | 3.89KB   |
| ion-text.entry.js                        | 227B     | 263B     | 401B     |
| ion-textarea.entry.js                    | 2.70KB   | 3.22KB   | 13.39KB  |
| ion-thumbnail.entry.js                   | 263B     | 312B     | 499B     |
| ion-toast.entry.js                       | 3.29KB   | 3.88KB   | 16.09KB  |
| ion-virtual-scroll.entry.js              | 3.56KB   | 4.14KB   | 13.19KB  |
| ios.transition-hash.js                   | 2.67KB   | 3.04KB   | 12.60KB  |
| keyboard-hash.js                         | 623B     | 720B     | 1.89KB   |
| md.transition-hash.js                    | 572B     | 675B     | 1.29KB   |
| menu-hash-hash-hash.js                   | 1.61KB   | 1.88KB   | 5.38KB   |
| overlays-hash-WFU.js                     | 3.24KB   | 3.80KB   | 11.58KB  |
| p-hash.js                                | 4.59KB   | 5.24KB   | 21.76KB  |
| spinner-hash-hash.js                     | 519B     | 573B     | 2.21KB   |
| status-tap-hash.js                       | 432B     | 533B     | 993B     |
| swipe-hash-hash.js                       | 582B     | 682B     | 1.18KB   |
| swiper.bundle-hash.js                    | 26.34KB  | 30.43KB  | 128.17KB |
| tap-hash-hash.js                         | 1011B    | 1.12KB   | 3.03KB   |
| theme-hash.js                            | 455B     | 556B     | 933B     |
| **TOTAL**                                | 275.59KB | 322.78KB | 1332.22KB |

