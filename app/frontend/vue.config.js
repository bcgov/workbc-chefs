process.env.VUE_APP_VERSION = require('./package.json').version;

const proxyObject = {
  target: 'http://localhost:8080',
  ws: true,
  changeOrigin: true,
};

module.exports = {
publicPath: process.env.VUE_APP_FRONTEND_BASEPATH ? process.env.VUE_APP_FRONTEND_BASEPATH : '/app',
transpileDependencies: ['vuetify'],
configureWebpack: {
    module: {
    rules: [
        {
        test: /\.mjs$/,
        include: /node_modules\/keycloak-js/,
        type: 'javascript/auto',
        use: {
            loader: 'babel-loader',
            options: {
            presets: [['@babel/preset-env', { modules: false }]],
            plugins: ['@babel/plugin-proposal-class-properties']
            }
        }
        }
    ]
    }
},
  devServer: {
    compress: true,
    proxy: {
      '/api': proxyObject,
      '/config': proxyObject,
    },
  },
  pluginOptions: {
    Keycloak: {
      chainWebpackMainProcess: config => {
        config.module
          .rule('babel')
          .test(/background\.js$/)
          .use('babel')
          .loader('babel-loader')
          .options({
            presets: [['@babel/preset-env', { modules: false }]],
            plugins: ['@babel/plugin-proposal-class-properties']
          })
      }
    }
  }
};