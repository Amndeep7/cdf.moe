module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            'vue-style-loader',
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                implementation: require('sass'),
                prependData: "@import '@/styles/variables.scss';",
                sassOptions: {
                  fiber: require('fibers'),
                },
              },
            },
          ],
        },
      ],
    },
  },
  transpileDependencies: [
    'vuetify',
  ],
};
