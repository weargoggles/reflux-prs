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
        this.owners = Immutable.List();
    },
    populate: function (repos) {
        this.owners = repos.map(function (repo) {
            return repo.get('owner').get('login');
        });
        this.trigger(this.owners);
    },
    getInitialState: function () {
        return this.owners;
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
        this._repos = Immutable.List();
        this.filter = function () { return true; };
    },
    output: function () {
        this.trigger(this._repos.filter(this.filter));
    },
    onFilterByOwner: function (owner) {
        if (typeof owner !== 'undefined') {
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
            });
        });
        this.output();
    },
    updatePRCounts: function (prs) {
        this._repos = this._repos.map(function (repo) {
            return repo.set('count', prs.filter(function (pr) {
                return pr.get('head').get('repo').get('id') === repo.get('id');
            }).size);
        });
        this.output();
    },
});

module.exports.RepoDisplayStore = RepoDisplayStore;
