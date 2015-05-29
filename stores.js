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
    },
    getInitialData: function () {
        return this._prs;
    }
});

var RepoDisplayStore = Reflux.createStore({
    init: function () {
        this.listenTo(RepoStore, 'updateRepos');
        this.listenTo(PRStore, 'updatePRCounts');
        this._repos = Immutable.List();
    },
    updateRepos: function (repos) {
        this._repos = repos.map(function (repo) {
            return Immutable.Map({
                id: repo.get('id'),
                owner: repo.get('owner').get('login'),
                name: repo.get('name'),
            });
        });
        this.trigger(this._repos);
    },
    updatePRCounts: function (prs) {
        this._repos = this._repos.map(function (repo) {
            return repo.set('count', prs.filter(function (pr) {
                return pr.get('head').get('repo').get('id') === repo.get('id');
            }).size);
        });
        this.trigger(this._repos);
    },
});

module.exports.RepoDisplayStore = RepoDisplayStore;
