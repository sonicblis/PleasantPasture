app.service("logProvider", ['firebase', function(firebase){
    var levels = {
        warn: false,
        info: false,
        debug: false,
        error: true
    };

    function log(level, context, message, args){
        var context = ((context) ? '[' + context + ']: ' : '');
        if (typeof args !== 'undefined') {
            console[level](context + message + ":", args);
        }
        else{
            console[level](context + message);
        }
    }

    this.setLoggingLevels = function(levelSettings){
        levels.warn = levelSettings.warn;
        levels.info = levelSettings.info;
        levels.debug = levelSettings.debug;
        levels.error = levelSettings.error;
    };
    this.info = function(context, message, args){
        if (levels.info) log('info', context, message, args);
    };
    this.warn = function(context, message, args){
        if (levels.warn) log('warn', context, message, args);
    };
    this.error = function(context, message, args){
        if (levels.error) log('error', context, message, args);
    };
    this.debug = function(context, message, args){
        if (levels.debug) log('debug', context, message, args);
    };
}]);