var gulp = require('gulp');
var plumber = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var pug = require('gulp-pug');
var sass = require('gulp-sass');
var htmlmin = require('gulp-htmlmin');
var browserSync = require('browser-sync');
var babel = require('gulp-babel');

gulp.task('browser-sync', function() {
    browserSync({
        server: {
             baseDir: "public"
        }, notify: false
    });
});

gulp.task('pug', function() {
    return gulp.src('src/index.pug')
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe(pug())
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true
        }))
        .pipe(gulp.dest('public'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('styles', function(){
    return gulp.src(['src/styles/main.sass'])
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(gulp.dest('src/styles'));
});

gulp.task('scripts', function(){
    return gulp.src(['src/js/app.js'])
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('public/js'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('default', ['browser-sync'], function(){
    gulp.watch("src/styles/main.sass", ['styles']);
    gulp.watch("src/js/app.js", ['scripts']);
    gulp.watch("src/index.pug", ['pug']);
});
