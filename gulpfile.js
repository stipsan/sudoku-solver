var ghpages = require('gh-pages');
var path = require('path');
var gulp = require('gulp');
var notify = require('gulp-notify');
var htmlreplace = require('gulp-html-replace');
var sourcemaps = require('gulp-sourcemaps');
var webpack = require('webpack');
var less = require('gulp-less');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');

var LessPluginCleanCSS = require("less-plugin-clean-css"),
cleancss = new LessPluginCleanCSS({advanced: true});

var LessPluginAutoPrefix = require('less-plugin-autoprefix'),
autoprefix= new LessPluginAutoPrefix({cascade: false, browsers: ['last 2 version', 'ie 8', 'ie 9', 'opera 12.1', 'android 4']});


var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = {
    target: "web",
    cache: true,
    entry: './src/app/sudoku.jsx',
    output: {
        path: './dist/js',
        publicPath: 'js/',
        filename: 'sudoku.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
    {  
        test: /\.jsx$/, loader: "jsx-loader?harmony"
    }
    ]
},
plugins: []
};
var serverConfig = {
    target: "web",
    debug: true,
    devtool: "source-map",
    hot: true,
    entry: ['webpack/hot/dev-server', './src/app/sudoku.jsx'],
    output: {
        path: path.join(__dirname, 'build', 'js'),
        publicPath: 'js/',
        filename: 'sudoku.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
    { test: /\.jsx$/, loader: "jsx-loader?harmony" },
    ]
},
plugins: []
};
var dist = './dist';
var src = './src';
var build = './build';

gulp.task('default', ['webpack-dev-server', 'watch'], function() {});

gulp.task('webpack-dev-server', function() {
    // Modify some webpack config options
    var myConfig = Object.create(serverConfig);
    
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            DEBUG: true
        })
    );
    
    new WebpackDevServer(webpack(myConfig), {
        contentBase: 'build/',
        publicPath: '/' + webpackConfig.output.publicPath
    }).listen(8062, 'localhost', function(err) {
        if (err) {
            throw new gutil.PluginError('webpack-dev-server', err);
        }
        
        gutil.log('[webpack-dev-server]', 'http://localhost:8062/');
    });
});

gulp.task('markup:build', function() {
    return gulp.src(src + "/www/**")
    .pipe(htmlreplace({
        'css': '/css/sudoku.css',
        'js': ['http://localhost:8080/webpack-dev-server.js', 'js/sudoku.js']
    }))
    .pipe(gulp.dest(build));
});
gulp.task('markup:dist', function() {
    return gulp.src(src + "/www/**")
    .pipe(htmlreplace({
        'css': 'css/sudoku.css?'+(new Date()).getTime(),
        'js': 'js/sudoku.min.js?'+(new Date()).getTime()
    }))
    .pipe(gulp.dest(dist));
});

gulp.task('less:watch', function () {
    livereload.listen();
    gulp.watch('./src/less/**/*', ['less:build', 'less:dist']);
});

gulp.task('less:build', function () {
    gulp.src('./src/less/sudoku.less')
    .pipe(plumber(function(error) {
        gutil.log(gutil.colors.red(error.message));
        gutil.beep();
        this.emit('end');
    }))
    .pipe(sourcemaps.init())
    .pipe(less({
        plugins: [autoprefix]
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(build+'/css'))
    .pipe(livereload());
});

gulp.task('less:dist', function () {
    gulp.src('./src/less/sudoku.less')
    .pipe(plumber(function(error) {
        gutil.log(gutil.colors.red(error.message));
        gutil.beep();
        this.emit('end');
    }))
    .pipe(less({
        plugins: [autoprefix, cleancss]
    }))
    .pipe(gulp.dest(dist+'/css'))
    .pipe(livereload());
});

// Build
// =====================================

gulp.task('build', ['markup:build', 'less:build'], function() {});

gulp.task('dist', ['markup:dist', 'webpack:dist.min', 'less:dist'], function() {});

gulp.task('webpack:dist', function(callback) {
    // Modify some webpack config options
    var myConfig = Object.create(webpackConfig);
    
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            DEBUG: false,
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin()
    );
    
    // Run webpack
    webpack(myConfig, function(err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack:build', err);
        }
        
        gutil.log('[webpack:build]', stats.toString({
            colors: true
        }));
        
        callback();
    });
});
gulp.task('webpack:dist.min', ['webpack:dist'], function(callback) {
    // Modify some webpack config options
    var myConfig = Object.create(webpackConfig);
    
    myConfig.output.filename = 'sudoku.min.js';
    
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            DEBUG: false,
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        })
    );
    
    // Run webpack
    webpack(myConfig, function(err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack:build', err);
        }
        
        gutil.log('[webpack:build]', stats.toString({
            colors: true
        }));
        
        callback();
    });
});

// Watch
// =====================================

gulp.task('watch', ['webpack:watch', 'less:watch', 'markup:watch'], function() {});

gulp.task('webpack:watch', function () {
    gulp.watch('./src/app/**/*.js', ['webpack:dist.min']);
});
gulp.task('markup:watch', function () {
    gulp.watch('./src/www/index.html', ['markup:build', 'markup:dist']);
});


gulp.task('publish', function(cb){
    ghpages.publish(path.join(__dirname, 'dist'), {
        logger: function(message) {
            console.log(message);
        }
    }, function(err) { 
        if (err) return cb(err); // return error
        cb(); // finished task
    });
});