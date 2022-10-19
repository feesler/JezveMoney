import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export default {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [new CssMinimizerPlugin(), '...'],
    },
};
