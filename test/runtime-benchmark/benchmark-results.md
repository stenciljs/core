# Stencil Runtime Performance Benchmark

**Last Run:** 2026-02-06T22:55:07.325Z
**Node:** v22.14.0 | **Platform:** darwin (x64)

## Latest Results

| Operation              |        Avg |        Min |        Max |    StdDev |
|------------------------|------------|------------|------------|-----------|
| Create 1,000 rows      | **90.72ms** |    73.80ms |   120.20ms |   19.15ms |
| Replace 1,000 rows     | **74.86ms** |    72.40ms |    77.10ms |    1.60ms |
| Update every 10th row  | **110.16ms** |   108.30ms |   111.40ms |    1.29ms |
| Swap rows              | **115.80ms** |   107.70ms |   141.00ms |   12.67ms |
| Select row             | **108.24ms** |   107.70ms |   108.80ms |    0.38ms |
| Remove row             | **108.02ms** |   105.50ms |   110.70ms |    1.81ms |
| Create 10,000 rows     | **646.80ms** |   573.80ms |   741.20ms |   63.49ms |
| Append 1,000 rows      | **165.98ms** |   135.40ms |   204.00ms |   23.51ms |
| Clear rows             | **108.76ms** |   104.10ms |   112.40ms |    3.05ms |

## History

| Date       | Create 1k |  Replace 1k |    Update | Create 10k | Node     |
|------------|-----------|-------------|-----------|------------|----------|
| 2/6/2026   |    90.7ms |      74.9ms |   110.2ms |    646.8ms | v22.14.0 |
| 2/6/2026   |    94.5ms |      76.0ms |   110.5ms |    664.1ms | v22.14.0 |
| 2/6/2026   |    82.5ms |      74.6ms |   109.8ms |    668.5ms | v22.14.0 |
| 2/6/2026   |    88.5ms |      74.9ms |   110.1ms |    675.5ms | v22.14.0 |
