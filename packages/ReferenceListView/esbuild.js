const esbuild = require('esbuild');
const extensibilityMap = require('@neos-project/neos-ui-extensibility/extensibilityMap.json');
const isWatch = process.argv.includes('--watch');
const CssModulesPlugin = require('esbuild-css-modules-plugin');

/** @type {import('esbuild').BuildOptions} */
const options = {
    logLevel: 'info',
    bundle: true,
    minify: !isWatch,
    target: 'es2020',
    entryPoints: { 'Plugin': 'src/index.js' },
    loader: {
       '.js': 'tsx'
    },
    alias: extensibilityMap,
    outdir: '../../Resources/Public/ReferenceListView',
    plugins: [
        CssModulesPlugin({
            force: true,
            emitDeclarationFile: false,
            localsConvention: 'camelCaseOnly',
            namedExports: true,
            inject: false
        })
    ]
};

if (isWatch) {
  esbuild.context(options).then((ctx) => ctx.watch());
} else {
  esbuild.build(options);
}
