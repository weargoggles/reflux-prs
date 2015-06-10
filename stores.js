var Reflux = require('reflux');
var Immutable = require('immutable');

var actions = require('./actions');

var RepoStore = Reflux.createStore({
    listenables: actions,
    updateRepoListCompleted: function (data) {
        this.repos = data;
        this.trigger(this.repos);
    }
});

var OwnerStore = Reflux.createStore({
    init: function () {
        this.listenTo(RepoStore, 'populate');
        this.owners = Immutable.Set();
    },
    populate: function (repos) {
        this.owners = repos.map(function (repo) {
            return repo.get('owner').get('login');
        }).toSet();
        this.trigger(this.owners);
    },
    getInitialState: function () {
        return this.owners;
    }
});

var SelectedOwnerStore = Reflux.createStore({
    listenables: actions,
    init: function () {
        this._selected = "";
    },
    onSelectOwner: function (owner) {
        if (owner) {
            this._selected = owner;
        }
        else {
            this._selected = "";
        }
        this.trigger(this._selected);
    },
    getInitialState: function () {
        return this._selected;
    }
});

var PRStore = Reflux.createStore({
    listenables: actions,
    init: function () {
        this._prs = Immutable.List([]);
    },
    updatePRListCompleted: function (data) {
        var updated = data.map(function (pr) { return pr.get('id') });
        this._prs = this._prs.filterNot(function (pr) {
            return updated.find(function (id) { return pr.get('id') === id; });
        }).merge(data);
        this.trigger(this._prs);
    }
});

var RepoDisplayStore = Reflux.createStore({
    listenables: actions,
    init: function () {
        this.listenTo(RepoStore, 'updateRepos');
        this.listenTo(PRStore, 'updatePRCounts');
        this._repos = Immutable.List([]);
        this.filter = function () { return true; };
    },
    output: function () {
        this.trigger(this._repos.filter(this.filter).sortBy(function (repo) { return repo.get('count'); }).reverse());
    },
    onFilterByOwner: function (owner) {
        if (owner) {
            this.filter = function (repo) {
                return repo.get('owner') === owner;
            };
        }
        else {
            this.filter = function () { return true; };
        }
        this.output();
    },
    updateRepos: function (repos) {
        this._repos = repos.map(function (repo) {
            return Immutable.Map({
                id: repo.get('id'),
                owner: repo.get('owner').get('login'),
                name: repo.get('name'),
                count: 0
            });
        });
        this.output();
    },
    updatePRCounts: function (prs) {
        this._repos = this._repos.map(function (repo) {
            var pr_count = prs.filter(function (pr) {
                return pr.get('head').get('repo').get('id') === repo.get('id');
            }).size;
            if (pr_count) {
                return repo.set('count', pr_count);
            }
            else {
                return repo;
            }
        });
        this.output();
    },
    getInitialState: function () {
        console.log('repostore initial state call', this._repos);
        return this._repos;
    }
});

module.exports.RepoDisplayStore = RepoDisplayStore;
module.exports.OwnerStore = OwnerStore;
module.exports.SelectedOwnerStore = SelectedOwnerStore;
