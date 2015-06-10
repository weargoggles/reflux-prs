var stores = require('./stores');
var actions = require('./actions');
var components = require('./components');
var React = require('react');


stores.RepoDisplayStore.listen(function (foo) { console.log("displays", foo); });

actions.init();

React.render(
    React.createElement('div', {}, [
        React.createElement(components.OwnerDropdown),
        React.createElement(components.RepoList)
    ]),
    document.body
);
