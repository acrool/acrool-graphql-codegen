import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'node:path';
import {visualizer} from 'rollup-plugin-visualizer';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        eslint(),
        dts({
            insertTypesEntry: true,
        }),
        visualizer() as Plugin,
    ],
    build: {
        sourcemap: process.env.NODE_ENV !== 'production',
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            formats: ['cjs'],
            fileName: (format) => `bear-graphql-react-query.${format}.js`,
        },
        rollupOptions: {
            external: [
                '@graphql-codegen/plugin-helpers',
                '@graphql-codegen/visitor-plugin-common',
                'path',
            ],
        },
    },
});
