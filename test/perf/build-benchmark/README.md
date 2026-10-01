# Build Benchmark

Measures Stencil compile time using the `build/integration` project as a fixture.

## Usage

```bash
# Run benchmark
pnpm benchmark

# Run with verbose output (shows build logs)
pnpm benchmark:verbose
```

## What it measures

The benchmark times `stencil build` on the integration project, which includes:
- ~20 components
- Multiple output targets (www, dist, dist-hydrate-script, docs-json, react-output-target)
- Rollup plugins (linaria, css-only, node-builtins)
- ES5 builds
- Source maps

## Output

```
Build Benchmark
================
Fixture: build/integration

Cleaning previous build...
Running build...

Results
-------
Build time: 12.34s

BENCHMARK_RESULT: build_time=12.34s
```

The `BENCHMARK_RESULT` line can be parsed by CI for tracking.

## See Also

- `../../build/integration/` - The fixture project being benchmarked
- `../runtime-benchmark/` - Runtime performance benchmarks
- `../performance/` - General performance tests
