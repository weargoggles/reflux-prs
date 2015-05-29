require('es6-promise').polyfill();
var Reflux = require('reflux');
var xr = require('xr');
var Immutable = require('immutable');

xr.configure({
    headers: {
        'authorization': 'Token 4ea3499b168dcece0fbc50a1d66a16c5fb6e827a'
    }
});

function xrp (x) {
    return new Promise(function (resolve, reject) {
        x.then(function (res) {
            resolve(Immutable.fromJS(res.data));
        }).catch(function (res) {
            reject(res.status);
        });
    });
}


var actions = Reflux.createActions({
    "init": {},
    "updateRepoList": { asyncResult: true },
    "updateAllPRLists": { asyncResult: true },
    "updatePRList": { asyncResult: true },
    "updatePRStatus": { asyncResult: true },
});

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
        this._prs = this._prs.exclude(function (pr) {
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

RepoDisplayStore.listen(function (foo) { console.log("display", foo.toJS()); });

var PRStatusStore = Reflux.createStore({});

actions.init.listen(actions.updateRepoList);

actions.updateRepoList.listenAndPromise(function () {
    return xrp(xr.get('https://api.github.com/user/repos', {}, {
        headers: {
            'accept': 'application/vnd.github.moondragon+json',
            'authorization': 'Token 4ea3499b168dcece0fbc50a1d66a16c5fb6e827a'
        }
    }));
});

actions.updateRepoList.completed.listen(actions.updateAllPRLists);

actions.updateAllPRLists.listenAndPromise(function (repos) {
    return Promise.all(repos.map(function (repo) {
        return actions.updatePRList(repo.get('owner').get('login'), repo.get('name'));
    }).toJS());
});

actions.updateAllPRLists.completed.listen(function () {
    console.log("finished loading PRs for all repositories");
});

actions.updatePRList.listenAndPromise(function (owner, repo) {
    return xrp(xr.get('https://api.github.com/repos/' + owner + '/' + repo + '/pulls', {}, {
        headers: {
            'authorization': 'Token 4ea3499b168dcece0fbc50a1d66a16c5fb6e827a'
        }
    }));
});

actions.init();
