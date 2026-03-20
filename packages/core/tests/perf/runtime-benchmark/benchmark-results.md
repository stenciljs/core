# Stencil Runtime Performance Benchmark

**Last Run:** 2026-03-09T16:28:58.823Z
**Stencil:** 5.0.0-next.0 | **Node:** v22.22.0 | **Platform:** darwin (x64)

## Latest Results

| Operation              |        Avg |        Min |        Max |    StdDev |
|------------------------|------------|------------|------------|-----------|
| Create 1,000 rows      | **77.70ms** |    61.40ms |    95.40ms |   13.75ms |
| Replace 1,000 rows     | **70.46ms** |    65.30ms |    78.40ms |    4.77ms |
| Update every 10th row  | **120.88ms** |   109.10ms |   137.40ms |   11.85ms |
| Swap rows              | **105.84ms** |    94.40ms |   128.30ms |   12.70ms |
| Select row             | **96.96ms** |    80.40ms |   113.60ms |   14.32ms |
| Remove row             | **95.40ms** |    93.30ms |    97.30ms |    1.33ms |
| Create 10,000 rows     | **643.80ms** |   604.30ms |   695.80ms |   34.18ms |
| Append 1,000 rows      | **177.96ms** |   149.40ms |   198.00ms |   17.30ms |
| Clear rows             | **102.28ms** |    81.50ms |   112.00ms |   11.73ms |

## History

| Date       | Stencil  | Create 1k |  Replace 1k |    Update | Create 10k | Node     |
|------------|----------|-----------|-------------|-----------|------------|----------|
| 3/9/2026   | 5.0.0-next.0 |    77.7ms |      70.5ms |   120.9ms |    643.8ms | v22.22.0 |
| 2/7/2026   | 4.42.1   |    81.7ms |      72.5ms |   106.6ms |    652.6ms | v22.14.0 |
| 2/7/2026   | 4.42.1   |    90.1ms |      75.7ms |   102.7ms |    644.6ms | v22.14.0 |
| 2/6/2026   | -        |    90.7ms |      74.9ms |   110.2ms |    646.8ms | v22.14.0 |
| 2/6/2026   | -        |    94.5ms |      76.0ms |   110.5ms |    664.1ms | v22.14.0 |
| 2/6/2026   | -        |    82.5ms |      74.6ms |   109.8ms |    668.5ms | v22.14.0 |
| 2/6/2026   | -        |    88.5ms |      74.9ms |   110.1ms |    675.5ms | v22.14.0 |
