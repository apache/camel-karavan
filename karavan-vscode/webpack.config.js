/* eslint-disable @typescript-eslint/no-var-requires */
//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const imageInlineSizeLimit = parseInt(
    process.env.IMAGE_INLINE_SIZE_LIMIT || "10000"
);

// Webpack invokes an exported config function with (env, argv), where `env` holds the
// `--env` flags - not NODE_ENV. Read the mode from NODE_ENV (set by the npm scripts) and
// fall back to `argv.mode` / production so `mode` is never left unset.
const resolveMode = (webpackEnv, argv) =>
    process.env.NODE_ENV === "development" || argv?.mode === "development"
        ? "development"
        : "production";

const baseConfig = (webpackEnv, argv) => {
    const mode = resolveMode(webpackEnv, argv);
    const isEnvDevelopment = mode === "development";
    const isEnvProduction = mode === "production";

    return {
        mode,
        bail: isEnvProduction,
        devtool: isEnvProduction
            ? "source-map"
            : "eval-cheap-module-source-map",
        cache: {
            type: "filesystem",
            buildDependencies: { config: [__filename] },
        },
        resolve: {
            plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
            fallback: {
                buffer: require.resolve("buffer"),
                path: require.resolve("path-browserify"),
                url: require.resolve("url"),
                process: require.resolve('process/browser'),
            },
            extensions: ['.ts', ".tsx", ".js"], // Removed empty string, added .ts
        },
        module: {
            rules: [
                {
                    oneOf: [
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            loader: require.resolve("url-loader"),
                            options: {
                                limit: imageInlineSizeLimit,
                                name: "static/media/[name].[hash:8].[ext]",
                            },
                        },
                        {
                            test: /\.svg$/,
                            use: [
                                require.resolve("@svgr/webpack"),
                                require.resolve("url-loader"),
                            ],
                        },
                        {
                            test: /\.tsx?$/,
                            exclude: /node_modules\/(?!@patternfly\/react-topology).*/,
                            loader: require.resolve("ts-loader"),
                            options: {
                                allowTsInNodeModules: true,
                                transpileOnly: true, 
                            },
                        },
                        {
                            test: /\.css$/,
                            use: [
                                MiniCssExtractPlugin.loader,
                                {
                                    loader: require.resolve("css-loader"),
                                    options: {
                                        importLoaders: 1,
                                        sourceMap: isEnvProduction || isEnvDevelopment,
                                    },
                                },
                            ],
                            sideEffects: true,
                        },
                        {
                            loader: require.resolve("file-loader"),
                            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
                            options: {
                                name: "media/[name].[hash:8].[ext]",
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: "ignore.css",
            }),
        ],
    };
};

const extensionConfig = (webpackEnv, argv) => {
    return {
        ...baseConfig(webpackEnv, argv),
        target:  "node",
        entry: "./src/extension.ts",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "extension.js",
            libraryTarget: "commonjs2",
        },
        externals: {vscode: "commonjs vscode"},
    };
};

const webviewConfig = (webpackEnv, argv) => {
    return {
        ...baseConfig(webpackEnv, argv),
        entry: "./webview/index.tsx",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "webview.js",
        },
        plugins: [
            new MiniCssExtractPlugin(),
            new webpack.ProvidePlugin({
                Buffer: ["buffer", "Buffer"],
                process: "process/browser",
            }),
        ],
    };
};

const prerenderConfig = (webpackEnv, argv) => {
    return {
        ...baseConfig(webpackEnv, argv),
        target: "node",
        entry: "./webview/prerender.tsx",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "prerender.js",
            libraryTarget: "commonjs2",
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: "ignore.css",
            }),
            new webpack.ProvidePlugin({
                Buffer: ["buffer", "Buffer"],
                process: "process/browser",
            }),
            new CopyPlugin({
                patterns: [
                    {from: "metadata", to: "metadata"}
                ],
            }),
        ],
    };
};

module.exports = [extensionConfig, webviewConfig, prerenderConfig];
