var React = require('react');
var Reflux = require('reflux');
var stores = require('./stores');
var actions = require('./actions');

var OwnerDropdown = React.createClass({
    mixins: [
        Reflux.connect(stores.OwnerStore, "owners"),
        Reflux.connect(stores.SelectedOwnerStore, "selected")
    ],
    render: function () {
        return React.createElement(
            'select',
            {
                value: this.state.selected,
                onChange: function (event) {
                    actions.selectOwner(event.target.value);
                }
            },
            this.state.owners.toList().unshift("").map(function (owner) {
                return React.createElement('option', {
                    value: owner
                }, owner || '-');
            })
        );
    }
});


var RepoList = React.createClass({
    mixins: [
        Reflux.connect(stores.RepoDisplayStore, "repos")
    ],
    render: function () {
        return React.createElement(
            'ul',
            {},
            this.state.repos.map(function (repo) {
                var path = repo.get('owner') + '/' + repo.get('name');
                return React.createElement('li', {
                    style: {
                        "list-style-type": "none",
                        "margin-bottom": "1em"
                    }
                }, [
                    React.createElement('a', {
                        href: '//github.com/' + path
                    }, path),
                    React.createElement('span', {
                        style: {
                            padding: ".2em .6em",
                            "margin-left": ".8em",
                            "border-radius": "1em",
                            background: "#ccc"
                        }
                    }, repo.get('count'))
                ]);
            })
        );
    }
});

module.exports.OwnerDropdown = OwnerDropdown;
module.exports.RepoList = RepoList;
