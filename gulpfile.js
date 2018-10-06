'use strict';

// Подключим зависимости

var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

var config = {
	server: {
		baseDir: './'
	},
	tunnel: false,
	host: 'localhost',
	port: 9000
};

let files = ['*.js', '*.json', '*.css'];

gulp.task('reload', function () {
  return gulp.src(files)
    .pipe(reload({
			stream: true
		}));
});

// Задача по умолчанию
gulp.task('default', ['serve']);

// Локальный сервер, слежение
gulp.task('serve', function() {
  browserSync.init(config);
  gulp.watch([files],['reload']);
});
