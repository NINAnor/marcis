const path = require('path')

export default {
  root: path.resolve(__dirname, 'src'),
  build: {
    sourcemap: true,
    outDir: "../dist",
  },
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
}
