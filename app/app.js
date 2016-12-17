(function(){
    angular.module('pleasantPastureApp', ['firebase', 'ui.router'])
        .run(['logProvider', '$rootScope', '$state', '$http', 'envService', '$location', function(logProvider, $rootScope, $state, $http, envService, $location){
            logProvider.setLoggingLevels({
                warn: true,
                error: true,
                debug: true,
                info: true
            });

            $http.get('app/env.json')
                .then(function(result){
                    var host = $location.host().replace('www.', '').replace('.com','').toLowerCase(),
                        relevantEnv = result.data[host];

                    if (relevantEnv.STRIPE_PUBLIC_KEY) {
                        envService.setStripePublicKey(relevantEnv.STRIPE_PUBLIC_KEY);
                    }
                    else{
                        throw new Error('The stripe public key could not be retrieved.  Make sure you have an env.json file configured.');
                    }

                    if (relevantEnv.PLEASANTPASTURE_API_URL){
                        envService.setPleasantPastureAPIUrl(relevantEnv.PLEASANTPASTURE_API_URL);
                    }
                    else{
                        throw new Error('The pleasant pasture url could not be retrieved.  Make sure you have an env.json file configured.');
                    }
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