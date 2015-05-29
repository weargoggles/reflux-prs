var stores = require('./stores');
var actions = require('./actions');


stores.RepoDisplayStore.listen(function (foo) { console.log("displays", foo.toJS()); });

actions.init();
