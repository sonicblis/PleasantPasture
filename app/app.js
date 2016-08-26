(function(){
    angular.module('pleasantPastureApp', ['firebase', 'ui.router'])
        .run(['logProvider', '$rootScope', '$state', function(logProvider, $rootScope, $state){
            logProvider.setLoggingLevels({
                warn: true,
                error: true,
                debug: true,
                info: true
            });

            $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
                logProvider.debug('stateChange', 'trying to go to state', toState);
                if (toState.redirectTo) {
                    e.preventDefault();
                    $state.go(toState.redirectTo, toParams, {location: 'replace'});
                }
            });
        }]);
})();