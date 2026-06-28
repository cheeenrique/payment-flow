const nodeExternals = require('webpack-node-externals');

/**
 * Config webpack do builder do NestJS.
 *
 * Objetivos:
 *  - resolver o alias `@/*` -> `src/*` (lido do tsconfig pelo ts-loader)
 *  - manter node_modules externos (não bundlar mongoose/@nestjs/etc),
 *    evitando warnings de optional-deps e bundle gigante.
 *
 * O NestJS chama esta função com a config padrão dele; estendemos.
 */
module.exports = function (options) {
  return {
    ...options,
    externals: [
      // Resolve node_modules a partir da raiz do monorepo (npm workspaces hoist).
      nodeExternals({
        modulesDir: require('node:path').resolve(__dirname, '../../node_modules'),
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve && options.resolve.alias),
        '@': require('node:path').resolve(__dirname, 'src'),
      },
    },
  };
};
