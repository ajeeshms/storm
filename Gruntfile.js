module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
                src: [
                    'src/intro.js',
                    'src/lib/sizzle.js',
                    'src/outro.js'
                ],
                dest: 'build/storm.js'
            }
        },
        uglify: {
            js: {
                files: {
                    'combined.js': ['combined.js']
                }
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('default', ['concat:css', 'cssmin:css', 'concat:js', 'uglify:js']);
};