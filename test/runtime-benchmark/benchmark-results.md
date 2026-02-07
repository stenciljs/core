# Stencil Runtime Performance Benchmark

**Last Run:** 2026-02-07T12:58:31.209Z
**Stencil:** 4.42.1 | **Node:** v22.14.0 | **Platform:** darwin (x64)

## Latest Results

| Operation              |        Avg |        Min |        Max |    StdDev |
|------------------------|------------|------------|------------|-----------|
| Create 1,000 rows      | **81.70ms** |    59.10ms |   100.60ms |   14.47ms |
| Replace 1,000 rows     | **72.46ms** |    63.00ms |    76.30ms |    4.84ms |
| Update every 10th row  | **106.58ms** |    89.90ms |   123.80ms |   10.94ms |
| Swap rows              | **81.44ms** |    74.40ms |    91.00ms |    7.66ms |
| Select row             | **89.62ms** |    77.50ms |    93.40ms |    6.14ms |
| Remove row             | **89.02ms** |    77.10ms |    92.90ms |    5.99ms |
| Create 10,000 rows     | **652.60ms** |   557.30ms |   726.00ms |   70.66ms |
| Append 1,000 rows      | **150.02ms** |   136.80ms |   170.00ms |   12.38ms |
| Clear rows             | **92.88ms** |    87.90ms |    95.20ms |    2.67ms |

## History

| Date       | Stencil  | Create 1k |  Replace 1k |    Update | Create 10k | Node     |
|------------|----------|-----------|-------------|-----------|------------|----------|
| 2/7/2026   | 4.42.1   |    81.7ms |      72.5ms |   106.6ms |    652.6ms | v22.14.0 |
| 2/7/2026   | 4.42.1   |    90.1ms |      75.7ms |   102.7ms |    644.6ms | v22.14.0 |
| 2/6/2026   | -        |    90.7ms |      74.9ms |   110.2ms |    646.8ms | v22.14.0 |
| 2/6/2026   | -        |    94.5ms |      76.0ms |   110.5ms |    664.1ms | v22.14.0 |
| 2/6/2026   | -        |    82.5ms |      74.6ms |   109.8ms |    668.5ms | v22.14.0 |
| 2/6/2026   | -        |    88.5ms |      74.9ms |   110.1ms |    675.5ms | v22.14.0 |
