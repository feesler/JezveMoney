import { merge } from 'webpack-merge';
import common from './webpack.common.js';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export default merge(common, {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [new CssMinimizerPlugin()],
    },
});
