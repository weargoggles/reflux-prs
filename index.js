var stores = require('./stores');
var actions = require('./actions');


stores.RepoDisplayStore.listen(function (foo) { console.log("displays", foo.toJS()); });

actions.init();

setTimeout(function () {
    actions.filterByOwner(1);

    setTimeout(function () {
        actions.filterByOwner();
    }, 1000);
}, 10000);
