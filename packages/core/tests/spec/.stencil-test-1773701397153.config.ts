
    // Auto-generated temporary config by stencil-test
    // This extends your stencil config and adds watchIgnoredRegex for screenshot files

    import { config as baseConfig } from "/Users/John.Jenkins/projects/stenciljs/packages/core/tests/spec/stencil.config.ts";

    export const config = {
      ...baseConfig,
      "watchIgnoredRegex": [
        /__screenshots__/,
    /__snapshots__/,
    /\.vitest-attachments/,
    /\.(png|jpg|jpeg|webp|gif)$/,
    /src\/.*\/[^/]*\.spec\.\{ts,tsx\}/,
    /src\/.*\/[^/]*\.spec\.\{ts,tsx\}/
      ]
    };
    