var ghpages = require('gh-pages');
var path = require('path');
var gulp = require('gulp');
var notify = require('gulp-notify');

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