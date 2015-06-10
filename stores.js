var Reflux = require('reflux');
var Immutable = require('immutable');

var actions = require('./actions');

var RepoStore = Reflux.createStore({
    listenables: actions,
    updateRepoListCompleted: function (data) {
        this.state = data;
        this.trigger(this.state);
    }
});

var OwnerStore = Reflux.createStore({
    init: function () {
        this.listenTo(RepoStore, 'populate');
        this.state = Immutable.Set();
    },
    populate: function (repos) {
        this.state = repos.map(function (repo) {
            return repo.get('owner').get('login');
        }).toSet();
        this.trigger(this.state);
    },
    getInitialState: function () {
        return this.state;
    }
});

var SelectedOwnerStore = Reflux.createStore({
    listenables: actions,
    init: function () {
        this.state = "";
    },
    onSelectOwner: function (owner) {
        if (owner) {
            this.state = owner;
        }
        else {
            this.state = "";
        }
        this.trigger(this.state);
    },
    getInitialState: function () {
        return this.state;
    }
});

var PRStore = Reflux.createStore({
    listenables: actions,
    init: function () {
        this.state = Immutable.List([]);
    },
    updatePRListCompleted: function (data) {
        var updated = data.map(function (pr) { return pr.get('id'); });
        this.state = this.state.filterNot(function (pr) {
            return updated.find(function (id) { return pr.get('id') === id; });
        }).merge(data);
        this.trigger(this.state);
    }
});

var RepoDisplayStore = Reflux.createStore({
    listenables: actions,
    init: function () {
        this.listenTo(RepoStore, 'updateRepos');
        this.listenTo(PRStore, 'updatePRCounts');
        this.state = Immutable.List([]);
        this.filter = function () { return true; };
    },
    output: function () {
        this.trigger(this.state.filter(this.filter).sortBy(function (repo) { return repo.get('count'); }).reverse());
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
        this.state = repos.map(function (repo) {
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
        this.state = this.state.map(function (repo) {
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
        console.log('repostore initial state call', this.state);
        return this.state;
    }
});

module.exports.RepoDisplayStore = RepoDisplayStore;
module.exports.OwnerStore = OwnerStore;
module.exports.SelectedOwnerStore = SelectedOwnerStore;
