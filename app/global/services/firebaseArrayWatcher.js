app.service('firebaseArrayWatcher', ['firebase', '$firebaseArray', 'logProvider', function(firebase, $firebaseArray, logProvider){
    var watchers = {};
    this.getWatcher = function(firebaseRef, promiseToResolve){
        if (!watchers[firebaseRef]){
            watchers[firebaseRef] = [];
            var fbArray = $firebaseArray(firebaseRef);
            if (promiseToResolve) {
                fbArray.$loaded(function(){
                    promiseToResolve.resolve();
                });
            }
            fbArray.$watch(function(args){
                //logProvider.debug('firebaseArrayWatcher', 'Got a firebase array event', args);
                if (args.event === firebase.events.childAdded){
                    watchers[firebaseRef].push(fbArray.$getRecord(args.key));
                }
                else if (args.event === firebase.events.childRemoved){
                    //logProvider.info('firebaseArrayWatcher', 'Removing array entry with key', args.key);
                    var removedItem = watchers[firebaseRef].find(function(activity){
                        return activity.$id == args.key;
                    });
                    watchers[firebaseRef].splice(watchers[firebaseRef].indexOf(removedItem), 1);
                }
            });
        }
        return watchers[firebaseRef];
    }
}]);