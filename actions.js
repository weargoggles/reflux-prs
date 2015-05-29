require('es6-promise').polyfill();
var Reflux = require('reflux');
var xr = require('xr');
var Immutable = require('immutable');

xr.configure({
    headers: {
        'accept': 'application/vnd.github.moondragon+json',
        'authorization': 'Token GITHUB_TOKEN'
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

actions.init.listen(actions.updateRepoList);

actions.updateRepoList.listenAndPromise(function () {
    return xrp(xr.get('https://api.github.com/user/repos'));
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
    return xrp(xr.get('https://api.github.com/repos/' + owner + '/' + repo + '/pulls'));
});

module.exports = actions;
