'use strict';


module.exports = function copyto(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-copy-to');

    // Options
    return {
        build: {
            files: [{
                cwd: 'app/',
                src: ['index.html'],
                dest: 'dist/'
            },
            {
                cwd: 'app/js',
                src: ['webcomponents.js'],
                dest: 'dist/js/'
            },
            {
                cwd: 'app/bower_components/font-awesome/',
                src: ['fonts/*','css/font-awesome.css'],
                dest: 'dist/font-awesome/'
            }],
            options: {
                ignore: []
            }
        }
    };
};
