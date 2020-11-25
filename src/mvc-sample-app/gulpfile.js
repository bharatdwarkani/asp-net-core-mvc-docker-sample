/// <binding />
"use strict";
var gulp = require('gulp');
var sass = require("gulp-sass");
var cssmin = require("gulp-cssmin");
var runSequence = require('gulp4-run-sequence');
var tslintHtmlReport = require('tslint-html-report');
var uglify = require('gulp-uglify');
let cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var glob = require('glob');
var shelljs = require('shelljs');
var fs = require('fs');
var merge = require("merge-stream");
var bundleconfig = require("./bundleconfig.json");
var regex = {
    css: /\.css$/,
    html: /\.(html|htm)$/,
    js: /\.js$/
};

var buildMode = (process.env.NODE_ENV !== 'Release') ? 'development' : 'production';
var isRelease = buildMode === 'development'?  false: true;

var tsConfig = {
    tslint: './tslint.json', // path to tslint.json
    srcFiles: 'wwwroot/ts/**/*.ts', // files to lint
    outDir: 'tslint-report', // output folder to write the report to
    html: 'tslint-report.html', // name of the html report generated
    exclude: [], // Files/patterns to exclude
    breakOnError: false, // Should it throw an error in tslint errors are found
    typeCheck: true, // enable type checking. requires tsconfig.json
    tsconfig: './wwwroot/ts/tsconfig.json' // path to tsconfig.json
}

gulp.task('pre-build', function (done) {
    runSequence('app-webpack', 'sass-to-css', 'css-minify', 'minCss:bundle', done);
});

gulp.task('build', function (done) {
    shelljs.exec('gulp pre-build', function (code, stdout, stderr) {
      if (code == 1) {
        fs.writeFileSync('../../cireports/errorlogs/app-error.txt', stderr);
        process.exit(-1)
      }
      done(code);
    });
  });

gulp.task('ts-js', function (done) {
    shelljs.exec('webpack --config webpack.config.js', { silent: false }, function () {
        done();
    });

});


function getTsFiles() {
    var files = glob.sync('./wwwroot/ts/**/*.ts', { silent: true });
    var entries = {};
    for (var i = 0; i < files.length; i++) {
        var entry = files[i].replace('./', '');
        var entryPoint = entry.replace(/\.ts/, '').replace('wwwroot/ts/','');
        entries[entryPoint] = './' + entry;
    }
    return entries;
}

// Gulp task to minify JavaScript files
gulp.task('js-minify', function (done) {
    var jsMinify =  gulp.src('./wwwroot/js/main.js')
        // Minify the file
        .pipe(uglify())
        // Output
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./wwwroot/dist/js'))
    jsMinify.on('end', function () {
        //run some code here
        done();
    });
    jsMinify.on('error', function (err) {
        done(err);
    });
});

// Gulp task to minify css files
gulp.task('css-minify', () => {
    return gulp.src('./wwwroot/css/**/*.css')
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./wwwroot/dist/css'));
});


gulp.task('sass-to-css', function () {
    return gulp.src(['./wwwroot/scss/**/*.scss'])
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(gulp.dest('./wwwroot/css'));
});

gulp.task('sass-to-css:watch', function () {
    gulp.watch('./wwwroot/scss/**/*.scss', function (done) {
        runSequence(['sass-to-css'], done);
    });
});

gulp.task('ts-to-js:watch', function () {
    gulp.watch('./wwwroot/ts/**/*.ts', function (done) {
        runSequence(['ts-js'], done);
    });
});

gulp.task("ts-lint", function (done) {
    return tslintHtmlReport(tsConfig, () => done());
})

gulp.task('sass-lint', function (done) {
    shelljs.exec('sass-lint -c sass-lint.yml -v -q', function (code, stdout, stderr) {
        done(code);
    });
});

gulp.task('webpack', function (done) {
    shelljs.exec('webpack --config webpack.config.js', function (code, stdout, stderr) {
        done(code);
    });
});

gulp.task("webpack:bundle", async function () {
    if (!isRelease)
      return true;

    var tasks = getBundles(regex.js).map(function (bundle) {
        return gulp.src(bundle.inputFiles, { base: "." })
            .pipe(concat(bundle.outputFileName))
            .pipe(gulp.dest("."));
    });
    return merge(tasks);
});

gulp.task("minCss:bundle", async function () {
    if (!isRelease)
        return true;

    var tasks = getBundles(regex.css).map(function (bundle) {
        return gulp.src(bundle.inputFiles, { base: "." })
            .pipe(concat(bundle.outputFileName))
            .pipe(cssmin())
            .pipe(gulp.dest("."));
    });
    return merge(tasks);
});

function getBundles(regexPattern) {
    return bundleconfig.filter(function (bundle) {
        return regexPattern.test(bundle.outputFileName);
    });
}

gulp.task('app-webpack', function (done) {
    runSequence('webpack', 'webpack:bundle', done);
});

gulp.task('app-lint', function (done) {
    runSequence(['sass-lint', 'ts-lint'], done);
});

