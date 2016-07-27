var gulp       = require('gulp'),
    tsify      = require('tsify'),
    browserify = require('browserify'),
    editJson   = require('gulp-json-editor'),
    sass       = require('gulp-sass'),
    pug        = require('gulp-pug'),
    zip        = require('gulp-zip'),
    gutil      = require('gulp-util'),
    source     = require('vinyl-source-stream'),
    path       = require('path'),
    exec       = require('child_process').exec,
    Promise    = require('es6-promise').Promise;

var targets = [
    {
        name:  'content',
        entry: './src/content.ts'
    },
    {
        name:  'background',
        entry: './src/background.ts'
    },
    {
        name:  'options',
        entry: './src/options.ts'
    }
];
for (let t of targets) {
    gulp.task(`${t.name}-browserify`, () => {
        return browserify(t.entry, { debug: true })
            .plugin('tsify', { noImplititAny: true })
            .bundle()
            .on('error', function(err) {
                gutil.log(err.toString());
                this.emit('end');
            })
            .pipe(source(path.basename(t.entry).replace(/\.ts$/, '.js')))
            .pipe(gulp.dest('app/js'));
    });
}
gulp.task('typescript', gulp.parallel(targets.map(t => `${t.name}-browserify`)));

gulp.task('sass', () => {
    return gulp.src('src/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('app/css'));
});

gulp.task('pug', () => {
    return gulp.src('src/**/*.pug')
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest('app/html'));
});

gulp.task('img', () => {
    return gulp.src('src/img/*')
        .pipe(gulp.dest('app/img'));
});

gulp.task('manifest', () => {
    return version().then(function(version) {
        return gulp.src('src/manifest.json')
            .pipe(editJson({ version : version }))
            .pipe(gulp.dest('app/'));
    });
});
function version() {
    var promise = new Promise(function(resolve, reject) {
        exec('git describe --tags --always --dirty', function(err, stdout, stderr) {
            return err ? reject(err) : resolve(stdout);
        });
    });
    return promise.then(function(desc) {
        var version = desc.replace(/\n$/, '')
            .replace(/-(\d+)/, '.$1')
            .replace(/-g[0-9a-f]+/, '')
            .replace(/-dirty/, '');
        return version;
    });
}

gulp.task('build', gulp.parallel(['typescript', 'sass', 'pug', 'img', 'manifest']));

gulp.task('zip', () => {
    return version().then(function(version) {
        return gulp.src('app/**/*')
            .pipe(zip('cycle-label-' + version + '.zip'))
            .pipe(gulp.dest('releases'));
    });
});

gulp.task('package', gulp.series('build', 'zip'));

gulp.task('watch', () => {
    gulp.watch('src/**/*.ts',       gulp.parallel(['typescript']));
    gulp.watch('src/**/*.scss',     gulp.parallel(['sass']));
    gulp.watch('src/**/*.pug',      gulp.parallel(['pug']));
    gulp.watch('src/img/*',         gulp.parallel(['img']));
    gulp.watch('src/manifest.json', gulp.parallel(['manifest']));
});

gulp.task('default', gulp.series('build', 'watch'));
