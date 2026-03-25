# Stencil Runtime Performance Benchmark

**Last Run:** 2026-03-24T22:13:10.991Z
**Stencil:** 5.0.0-next.0 | **Node:** v22.22.0 | **Platform:** darwin (x64)

## Latest Results

| Operation              |        Avg |        Min |        Max |    StdDev |
|------------------------|------------|------------|------------|-----------|
| Create 1,000 rows      | **78.96ms** |    66.90ms |    92.80ms |    8.42ms |
| Replace 1,000 rows     | **65.90ms** |    61.60ms |    75.40ms |    4.96ms |
| Update every 10th row  | **113.54ms** |    96.40ms |   131.70ms |   11.73ms |
| Swap rows              | **97.06ms** |    93.90ms |   101.90ms |    2.66ms |
| Select row             | **86.66ms** |    80.20ms |    96.60ms |    7.22ms |
| Remove row             | **91.66ms** |    80.10ms |    95.60ms |    5.81ms |
| Create 10,000 rows     | **567.88ms** |   476.60ms |   650.70ms |   55.32ms |
| Append 1,000 rows      | **160.08ms** |   128.40ms |   181.30ms |   17.92ms |
| Clear rows             | **79.84ms** |    77.50ms |    85.50ms |    2.92ms |

## History

| Date       | Stencil  | Create 1k |  Replace 1k |    Update | Create 10k | Node     |
|------------|----------|-----------|-------------|-----------|------------|----------|
| 3/24/2026  | 5.0.0-next.0 |    79.0ms |      65.9ms |   113.5ms |    567.9ms | v22.22.0 |
| 3/9/2026   | 5.0.0-next.0 |    77.7ms |      70.5ms |   120.9ms |    643.8ms | v22.22.0 |
| 2/7/2026   | 4.42.1   |    81.7ms |      72.5ms |   106.6ms |    652.6ms | v22.14.0 |
| 2/7/2026   | 4.42.1   |    90.1ms |      75.7ms |   102.7ms |    644.6ms | v22.14.0 |
| 2/6/2026   | -        |    90.7ms |      74.9ms |   110.2ms |    646.8ms | v22.14.0 |
| 2/6/2026   | -        |    94.5ms |      76.0ms |   110.5ms |    664.1ms | v22.14.0 |
| 2/6/2026   | -        |    82.5ms |      74.6ms |   109.8ms |    668.5ms | v22.14.0 |
| 2/6/2026   | -        |    88.5ms |      74.9ms |   110.1ms |    675.5ms | v22.14.0 |
