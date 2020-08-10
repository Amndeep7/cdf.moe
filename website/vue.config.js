const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

module.exports = {
  chainWebpack: (config) => {
    config
    .plugin('html')
    .tap((args) => {
      // eslint-disable-next-line no-param-reassign
      args[0].title = 'CDF.MOE';
      // eslint-disable-next-line no-param-reassign
      args[0].favicon = './public/favicon.svg';
      return args;
    });
  },
  configureWebpack: {
    plugins: [
      new FaviconsWebpackPlugin({
        logo: './public/favicon.svg',
      }),
    ],
  },
  transpileDependencies: [
    'vuetify',
  ],
};
