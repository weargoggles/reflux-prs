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

function xrp (x, accumulator) {
    return new Promise(function (resolve, reject) {
        x.then(function (res) {
            var link_header = res.xhr.getResponseHeader('link'),
                link_match = link_header && link_header.match(/<([^>]+)>; rel="next"/),
                data = Immutable.fromJS(res.data);
            if (accumulator) {
                data = accumulator.concat(data);
            }
            if (link_match) {
                resolve(xrp(xr.get(link_match[1]), data));
            }
            else {
                resolve(data);
            }
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
    "filterByOwner": {},
    "selectOwner": {},
});

actions.init.listen(actions.updateRepoList);

actions.updateRepoList.listenAndPromise(function () {
    return xrp(xr.get('https://api.github.com/user/repos'));
});

actions.updateRepoList.completed.listen(actions.updateAllPRLists);

actions.updateAllPRLists.listenAndPromise(function (repos) {
    return repos.map(function (repo) {
        return actions.updatePRList(repo.get('owner').get('login'), repo.get('name'));
    }).toJS();
});

/*
actions.updateAllPRLists.completed.listen(function () {
    console.log("finished loading PRs for all repositories");
});
*/

actions.updatePRList.listenAndPromise(function (owner, repo) {
    return xrp(xr.get('https://api.github.com/repos/' + owner + '/' + repo + '/pulls'));
});

actions.selectOwner.listen(actions.filterByOwner);
actions.selectOwner.listen(function (owner) { console.log("Owner " + owner + " selected");});

module.exports = actions;
