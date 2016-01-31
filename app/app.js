var app = angular.module('pleasantPastureApp', ['firebase']);
app.run(['logProvider', function(logProvider){
    logProvider.setLoggingLevels({
        warn: true,
        error: true,
        debug: false,
        info: true
    });
}]);