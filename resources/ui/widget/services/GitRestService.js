define([
    "dojo/_base/declare",
    "dojo/_base/url",
    "dojo/_base/array",
    "dojo/json",
    "dojo/request/xhr",
    "dojo/Deferred",
    "dojo/DeferredList",
    "../models/CommitModel",
    "../models/IssueModel",
    "../models/RequestModel",
    "./TemplateService",
    "../components/DefaultIssueTemplate/DefaultIssueTemplate"
], function (declare, url, array, json, xhr, Deferred, DeferredList,
    CommitModel, IssueModel, RequestModel,
    TemplateService, DefaultIssueTemplate) {
    var _instance = null;
    var GitRestService = declare(null, {
        gitHubString: "GITHUB",
        gitLabString: "GITLAB",
        gitHubApi: null, // use with new
        gitLabApi: null, // use without new
        issueTemplateName: "rtc-work-item-v1.md",
        gitHosts: null,
        gitHostType: function (name, displayName, requestPrefix) {
            this.name = name,
            this.displayName = displayName,
            this.requestPrefix = requestPrefix
        },

        constructor: function () {
            var self = this;

            // Prevent errors in Internet Explorer (dojo parse error because undefined)
            if (typeof com_siemens_bt_jazz_rtcgitconnector_modules !== 'undefined') {
                this.gitHubApi = com_siemens_bt_jazz_rtcgitconnector_modules.GitHubApi;
                this.gitLabApi = com_siemens_bt_jazz_rtcgitconnector_modules.GitLabApi;
            }

            this.gitHosts = {
                gitHubHost: new this.gitHostType(this.gitHubString, "GitHub", "Pull "),
                gitLabHost: new this.gitHostType(this.gitLabString, "GitLab", "Merge "),
                otherGitHost: new this.gitHostType("OTHER", "Other", ""),
                getHostType: function (name) {
                    if (name.toUpperCase() === self.gitHubString) {
                        return self.gitHosts.gitHubHost;
                    } else if (name.toUpperCase() === self.gitLabString) {
                        return self.gitHosts.gitLabHost;
                    } else {
                        return self.gitHosts.otherGitHost;
                    }
                }
            };
        },

        createNewIssue: function (selectedGitRepository, gitHost, accessToken, workItem) {
            if (gitHost.name === this.gitHubString) {
                return this.createNewGitHubIssue(selectedGitRepository, accessToken, workItem);
            } else if (gitHost.name === this.gitLabString) {
                return this.createNewGitLabIssue(selectedGitRepository, accessToken, workItem);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        createNewGitHubIssue: function (selectedGitRepository, accessToken, workItem) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                var tags = workItem.object.attributes.internalTags.content;
                tags = (tags.length) ? tags.split(", ") : [];
                tags.push("from-rtc-work-item");
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                this.getGitHubIssueTemplate(github, urlParts).then(function (result) {
                    createIssue(result);
                }, function (error) {
                    console.log("Couldn't find an issue template. Error: ", error);

                    // Use the default issue template if none was found on the server
                    var defaultIssueTemplateString = new DefaultIssueTemplate().getTemplateString();
                    createIssue(defaultIssueTemplateString);
                });

                var createIssue = function (templateString) {
                    var renderedTemplate = null;

                    try {
                        renderedTemplate = new TemplateService()
                            .renderTemplateWithWorkItem(templateString, workItem);
                    } catch (error) {
                        deferred.reject("There was an error when parsing the issue template. Error: " + error);

                        // Don't try to create the issue if the template rendering failed
                        return;
                    }

                    github.issues.create({
                        owner: urlParts[0],
                        repo: urlParts[1],
                        title: workItem.object.attributes.summary.content,
                        body: renderedTemplate,
                        labels: tags
                    }).then(function (response) {
                        deferred.resolve(IssueModel.CreateFromGitHubIssue(response.data, []));
                    }, function (error) {
                        deferred.reject("Couldn't create an issue in the GitHub repository. Error: " + (error.message || error));
                    });
                };
            }

            return deferred.promise;
        },

        getGitHubIssueTemplate: function (github, urlParts) {
            var deferred = new Deferred();
            var filePath = ".github/ISSUE_TEMPLATE/" + this.issueTemplateName;

            github.repos.getContents({
                owner: urlParts[0],
                repo: urlParts[1],
                path: filePath,
                headers: {
                    accept: "application/vnd.github.VERSION.raw"
                }
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject("Couldn't get the issue template from GitHub. Error: " + (error.message || error));
            });

            return deferred.promise;
        },

        createNewGitLabIssue: function (selectedGitRepository, accessToken, workItem) {
            var deferred = new Deferred();
            var giturl = this._createUrlInformation(selectedGitRepository.url);
            var tags = workItem.object.attributes.internalTags.content;
            tags = (tags.length) ? tags + ", " : tags;
            tags += "from-rtc-work-item";

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                this.getGitLabIssueTemplate(gitlab, giturl.joined).then(function (result) {
                    createIssue(result);
                }, function (error) {
                    console.log("Couldn't find an issue template. Error: ", error);

                    // Use the default issue template if none was found on the server
                    var defaultIssueTemplateString = new DefaultIssueTemplate().getTemplateString();
                    createIssue(defaultIssueTemplateString);
                });

                var createIssue = function (templateString) {
                    var renderedTemplate = null;

                    try {
                        renderedTemplate = new TemplateService()
                            .renderTemplateWithWorkItem(templateString, workItem);
                    } catch (error) {
                        deferred.reject("There was an error when parsing the issue template. Error: " + error);

                        // Don't try to create the issue if the template rendering failed
                        return;
                    }

                    gitlab.Issues.create(giturl.joined, {
                        title: workItem.object.attributes.summary.content,
                        description: renderedTemplate,
                        labels: tags
                    }).then(function (response) {
                        deferred.resolve(IssueModel.CreateFromGitLabIssue(response, []));
                    }, function (error) {
                        deferred.reject("Couldn't create an issue in the GitLab repository. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
                    });
                };
            }

            return deferred.promise;
        },

        getGitLabIssueTemplate: function (gitlab, projectId) {
            var deferred = new Deferred();
            var filePath = ".gitlab/issue_templates/" + this.issueTemplateName;

            gitlab.RepositoryFiles.showRaw(projectId, filePath, "master").then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                deferred.reject("Couldn't get the issue template from GitLab. Error: " + (error.message || error));
            });

            return deferred.promise;
        },

        addBackLinksToGitHost: function (params) {
            var deferredList = null;

            if (params.gitHost.name === this.gitHubString) {
                deferredList = this.addBackLinksToGitHub(params);
            } else if (params.gitHost.name === this.gitLabString) {
                deferredList = this.addBackLinksToGitLab(params);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                deferredList = new DeferredList([deferred]);
            }

            return deferredList;
        },

        addBackLinksToGitHub: function (params) {
            var self = this;
            var deferredArray = [];
            var repositoryUrl = new url(params.selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });
            var commentBody = "was linked by [RTC Work Item " + params.workItem.object.id + "]" +
                    "(" + params.workItem.object.locationUri + ")" +
                    " on behalf of " + params.currentUser;
            var commitCommentBody = "This commit " + commentBody;
            var issueCommentBody = "This issue " + commentBody;
            var requestCommentBody = "This pull request " + commentBody;

            if (urlParts.length < 2) {
                var deferred = new Deferred();
                deferred.reject("Invalid repository URL.");
                deferredArray.push(deferred);
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                if (params.commitsToLink && params.commitsToLink.length > 0) {
                    array.forEach(params.commitsToLink, function (commit) {
                        deferredArray.push(self.addBackLinksToGitHubCommit(github, urlParts[0], urlParts[1], commit.sha, commitCommentBody));
                    });
                }

                if (params.issuesToLink && params.issuesToLink.length > 0) {
                    array.forEach(params.issuesToLink, function (issue) {
                        deferredArray.push(self.addBackLinksToGitHubIssueOrRequest(github, urlParts[0], urlParts[1], issue.id, issueCommentBody));
                    });
                }

                if (params.requestsToLink && params.requestsToLink.length > 0) {
                    array.forEach(params.requestsToLink, function (request) {
                        deferredArray.push(self.addBackLinksToGitHubIssueOrRequest(github, urlParts[0], urlParts[1], request.id, requestCommentBody));
                    });
                }
            }

            return new DeferredList(deferredArray);
        },

        addBackLinksToGitHubCommit: function (github, owner, repo, sha, commentBody) {
            var deferred = new Deferred();

            github.repos.createCommitComment({
                owner: owner,
                repo: repo,
                sha: sha,
                body: commentBody
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject("Couldn't add a comment to the GitHub commit. Error: " + (error.message || error));
            });

            return deferred;
        },

        addBackLinksToGitHubIssueOrRequest: function (github, owner, repo, id, commentBody) {
            var deferred = new Deferred();

            github.issues.createComment({
                owner: owner,
                repo: repo,
                number: id,
                body: commentBody
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject("Couldn't add a comment to the GitHub issue or pull request. Error: " + (error.message || error));
            });

            return deferred;
        },

        addBackLinksToGitLab: function (params) {
            var self = this;
            var deferredArray = [];
            var giturl = this._createUrlInformation(params.selectedGitRepository.url);

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: params.accessToken,
                useXMLHttpRequest: true
            });

            var commentBody = "was linked by [RTC Work Item " + params.workItem.object.id + "]" +
                    "(" + params.workItem.object.locationUri + ")" +
                    " on behalf of " + params.currentUser;
            var commitCommentBody = "This commit " + commentBody;
            var issueCommentBody = "This issue " + commentBody;
            var requestCommentBody = "This merge request " + commentBody;

            if (giturl.parts.length < 2) {
                var deferred = new Deferred();
                deferred.reject("Invalid repository URL.");
                deferredArray.push(deferred);
            } else {
                if (params.commitsToLink && params.commitsToLink.length > 0) {
                    array.forEach(params.commitsToLink, function (commit) {
                        deferredArray.push(self.addBackLinksToGitLabCommits(gitlab, giturl.joined, commit.sha, commitCommentBody));
                    });
                }

                if (params.issuesToLink && params.issuesToLink.length > 0) {
                    array.forEach(params.issuesToLink, function (issue) {
                        deferredArray.push(self.addBackLinksToGitLabIssues(gitlab, giturl.joined, issue.id, issueCommentBody));
                    });
                }

                if (params.requestsToLink && params.requestsToLink.length > 0) {
                    array.forEach(params.requestsToLink, function (request) {
                        deferredArray.push(self.addBackLinksToGitLabRequests(gitlab, giturl.joined, request.id, requestCommentBody));
                    });
                }
            }

            return new DeferredList(deferredArray);
        },

        addBackLinksToGitLabCommits: function (gitlab, path, sha, commentBody) {
            var deferred = new Deferred();

            gitlab.Commits.createComment(path, sha, commentBody).then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                deferred.reject("Couldn't add a comment to the GitLab commit. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
            });

            return deferred;
        },

        addBackLinksToGitLabIssues: function (gitlab, path, id, commentBody) {
            var deferred = new Deferred();

            gitlab.IssueNotes.create(path, id, {
                body: commentBody
            }).then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                deferred.reject("Couldn't add a comment to the GitLab issue. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
            });

            return deferred;
        },

        addBackLinksToGitLabRequests: function (gitlab, path, id, commentBody) {
            var deferred = new Deferred();

            gitlab.MergeRequestNotes.create(path, id, {
                body: commentBody
            }).then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                deferred.reject("Couldn't add a comment to the GitLab merge request. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
            });

            return deferred;
        },

        // Try to get a commit by it's SHA
        getCommitById: function (selectedGitRepository, gitHost, accessToken, commitSha, alreadyLinkedUrls) {
            if (gitHost.name === this.gitHubString) {
                return this.getGitHubCommitById(selectedGitRepository, accessToken, commitSha, alreadyLinkedUrls);
            } else if (gitHost.name === this.gitLabString) {
                return this.getGitLabCommitById(selectedGitRepository, accessToken, commitSha, alreadyLinkedUrls);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get a commit from GitHub using it's SHA
        getGitHubCommitById: function (selectedGitRepository, accessToken, commitSha, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                github.repos.getCommit({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    sha: commitSha
                }).then(function (response) {
                    var convertedCommits = [];
                    convertedCommits.push(CommitModel.CreateFromGitHubCommit(response.data, alreadyLinkedUrls));
                    deferred.resolve(convertedCommits);
                }, function (error) {
                    // Just resolve with an empty array if not found
                    deferred.resolve([]);
                });
            }

            return deferred.promise;
        },

        // Get a commit from GitLab using it's SHA
        getGitLabCommitById: function (selectedGitRepository, accessToken, commitSha, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var giturl = this._createUrlInformation(selectedGitRepository.url);

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                gitlab.Commits.show(giturl.joined, commitSha).then(function (response) {
                    var commitUrlPath = giturl.repo + "/commit/";
                    var convertedCommits = [];
                    convertedCommits.push(CommitModel.CreateFromGitLabCommit(response, commitUrlPath, alreadyLinkedUrls));
                    deferred.resolve(convertedCommits);
                }, function (error) {
                    // Just resolve with an empty array if not found
                    deferred.resolve([]);
                });
            }

            return deferred.promise;
        },

        getIssueById: function (selectedGitRepository, gitHost, accessToken, issueId, alreadyLinkedUrls) {
            if (gitHost.name === this.gitHubString) {
                return this.getGitHubIssueById(selectedGitRepository, accessToken, issueId, alreadyLinkedUrls);
            } else if (gitHost.name === this.gitLabString) {
                return this.getGitLabIssueById(selectedGitRepository, accessToken, issueId, alreadyLinkedUrls);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get a GitHub issue by it's id (only if it's an issue, not a pull request)
        getGitHubIssueById: function (selectedGitRepository, accessToken, issueId, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                github.issues.get({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    number: issueId
                }).then(function (response) {
                    var convertedIssues = [];
                    if (!response.data.pull_request) {
                        convertedIssues.push(IssueModel.CreateFromGitHubIssue(response.data, alreadyLinkedUrls));
                    }
                    deferred.resolve(convertedIssues);
                }, function (error) {
                    // Just resolve with an empty array if not found
                    deferred.resolve([]);
                });
            }

            return deferred.promise;
        },

        // Get a GitLab issue by it's id
        getGitLabIssueById: function (selectedGitRepository, accessToken, issueId, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var giturl = this._createUrlInformation(selectedGitRepository.url);

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                gitlab.Issues.show(giturl.joined, issueId).then(function (response) {
                    var convertedIssues = [];
                    convertedIssues.push(IssueModel.CreateFromGitLabIssue(response, alreadyLinkedUrls));
                    deferred.resolve(convertedIssues);
                }, function (error) {
                    // Just resolve with an empty array if not found
                    deferred.resolve([]);
                });
            }

            return deferred.promise;
        },

        // Try to get a request by it's id
        getRequestById: function (selectedGitRepository, gitHost, accessToken, requestId, alreadyLinkedUrls) {
            if (gitHost.name === this.gitHubString) {
                return this.getGitHubRequestById(selectedGitRepository, accessToken, requestId, alreadyLinkedUrls);
            } else if (gitHost.name === this.gitLabString) {
                return this.getGitLabRequestById(selectedGitRepository, accessToken, requestId, alreadyLinkedUrls);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        getGitHubRequestById: function (selectedGitRepository, accessToken, requestId, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                github.pulls.get({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    number: requestId
                }).then(function (response) {
                    var convertedRequests = [];
                    convertedRequests.push(RequestModel.CreateFromGitHubRequest(response.data, alreadyLinkedUrls));
                    deferred.resolve(convertedRequests);
                }, function (error) {
                    // Just resolve with an empty array if not found
                    deferred.resolve([]);
                });
            }

            return deferred.promise;
        },

        getGitLabRequestById: function (selectedGitRepository, accessToken, requestId, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var giturl = this._createUrlInformation(selectedGitRepository.url);

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                gitlab.MergeRequests.show(giturl.joined, requestId).then(function (response) {
                    var convertedRequests = [];
                    convertedRequests.push(RequestModel.CreateFromGitLabRequest(response, alreadyLinkedUrls));
                    deferred.resolve(convertedRequests);
                }, function (error) {
                    // Just resolve with an empty array if not found
                    deferred.resolve([]);
                });
            }

            return deferred.promise;
        },

        // Get the last 100 commits from the specified repository on GitHub or GitLab
        getRecentCommits: function (selectedGitRepository, gitHost, accessToken, alreadyLinkedUrls) {
            if (gitHost.name === this.gitHubString) {
                return this.getRecentGitHubCommits(selectedGitRepository, accessToken, alreadyLinkedUrls);
            } else if (gitHost.name === this.gitLabString) {
                return this.getRecentGitLabCommits(selectedGitRepository, accessToken, alreadyLinkedUrls);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get the last 100 commits from the specified repository on GitHub
        getRecentGitHubCommits: function (selectedGitRepository, accessToken, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                github.repos.getCommits({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    per_page: 100
                }, function (error, response) {
                    if (error) {
                        var errorObj = json.parse(error.message || error);
                        deferred.reject("Couldn't get the commits from the GitHub repository. Error: " + ((errorObj && errorObj.message) || error.message || error));
                    } else {
                        var convertedCommits = [];
                        array.forEach(response.data, function (commit) {
                            convertedCommits.push(CommitModel.CreateFromGitHubCommit(commit, alreadyLinkedUrls));
                        });
                        deferred.resolve(convertedCommits);
                    }
                });
            }

            return deferred.promise;
        },

        // this should really be extracted to a separate class
        _createUrlInformation: function(param) {
            var original = new url(param);
            var origin = this._getOriginFromUrlObject(original);
            // this should then call the revamped removegitending function
            var sanitized = this._removeDotGitEnding(original.path)
            var parts = this._getUrlPartsFromPath(sanitized);
            // as mentioned below, this should be a member function
            // or maybe not even... not quite sure yet about this one

            return {
                original : original,
                origin: origin,
                sanitized: sanitized,
                parts: parts,
                joined: parts.join("/"),
                repo: origin + sanitized
            }
        },

        // Get the last 100 commits from the specified repository on GitLab
        getRecentGitLabCommits: function (selectedGitRepository, accessToken, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var giturl = this._createUrlInformation(selectedGitRepository.url);

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                gitlab.Commits.all(giturl.joined, {
                    max_pages: 1,
                    per_page: 100
                }).then(function (response) {
                    var commitUrlPath = giturl.repo + "/commit/";
                    var convertedCommits = [];
                    array.forEach(response, function (commit) {
                        convertedCommits.push(CommitModel.CreateFromGitLabCommit(commit, commitUrlPath, alreadyLinkedUrls));
                    });
                    deferred.resolve(convertedCommits);
                }, function (error) {
                    deferred.reject("Couldn't get the commits from the GitLab repository. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
                });
            }

            return deferred.promise;
        },

        // Get the last 100 issues form the specified repository on GitHub or GitLab
        getRecentIssues: function (selectedGitRepository, gitHost, accessToken, alreadyLinkedUrls) {
            if (gitHost.name === this.gitHubString) {
                return this.getRecentGitHubIssues(selectedGitRepository, accessToken, alreadyLinkedUrls);
            } else if (gitHost.name === this.gitLabString) {
                return this.getRecentGitLabIssues(selectedGitRepository, accessToken, alreadyLinkedUrls);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get the last 100 issues from the specified repository on GitHub
        getRecentGitHubIssues: function (selectedGitRepository, accessToken, alreadyLinkedUrls) {
            var self = this;
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                github.issues.getForRepo({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    state: "all",
                    per_page: 100
                }, function (error, response) {
                    if (error) {
                        var errorObj = json.parse(error.message || error);
                        deferred.reject("Couldn't get the issues from the GitHub repository. Error: " + ((errorObj && errorObj.message) || error.message || error));
                    } else {
                        var convertedIssues = [];
                        array.forEach(self._removePullRequestsFromIssuesList(response.data), function (issue) {
                            convertedIssues.push(IssueModel.CreateFromGitHubIssue(issue, alreadyLinkedUrls));
                        });
                        convertedIssues.push(self._createNewIssueElement(self.gitHosts.gitHubHost.displayName));
                        deferred.resolve(convertedIssues);
                    }
                });
            }

            return deferred.promise;
        },

        // Get the last 100 issues from the specified repository on GitLab
        getRecentGitLabIssues: function (selectedGitRepository, accessToken, alreadyLinkedUrls) {
            var self = this;
            var giturl = this._createUrlInformation(selectedGitRepository.url);
            var deferred = new Deferred();

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            // instead of checking for validity with the length of a path, it would be nice to
            // extract this check to the giturl object and return early.
            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                gitlab.Issues.all({
                    projectId: giturl.joined,
                    max_pages: 1,
                    per_page: 100
                }).then(function (response) {
                    var convertedIssues = [];
                    array.forEach(response, function (issue) {
                        convertedIssues.push(IssueModel.CreateFromGitLabIssue(issue, alreadyLinkedUrls));
                    });
                    convertedIssues.push(self._createNewIssueElement(self.gitHosts.gitLabHost.displayName));
                    deferred.resolve(convertedIssues);
                }, function (error) {
                    deferred.reject("Couldn't get the issues from the GitLab repository. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
                });
            }

            return deferred.promise;
        },

        // Create a fake issue object used to create a new issue in GitHub or GitLab
        _createNewIssueElement: function (gitHost) {
            return {
                id: -1,
                title: "Create a new issue in " + gitHost,
                alreadyLinked: false,
                state: "",
                openedBy: "",
                openedDate: 4684608000000 // Magic number! Should work for about 100 years though...
            };
        },

        // Get the last 100 requests (pull/merge) from the selected repository on GitHub or GitLab
        getRecentRequests: function (selectedGitRepository, gitHost, accessToken, alreadyLinkedUrls) {
            if (gitHost.name === this.gitHubString) {
                return this.getRecentGitHubRequests(selectedGitRepository, accessToken, alreadyLinkedUrls);
            } else if (gitHost.name === this.gitLabString) {
                return this.getRecentGitLabRequests(selectedGitRepository, accessToken, alreadyLinkedUrls);
            } else {
                var deferred = new Deferred();
                deferred.reject("Invalid git host.");
                return deferred.promise;
            }
        },

        // Get the last 100 pull requests from the selected repository on GitHub
        getRecentGitHubRequests: function (selectedGitRepository, accessToken, alreadyLinkedUrls) {
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var urlParts = this._getUrlPartsFromPath(repositoryUrl.path);
            var github = new this.gitHubApi({
                auth: accessToken
            });

            if (urlParts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                urlParts[urlParts.length - 1] = this._removeDotGitEnding(urlParts[urlParts.length - 1]);

                github.pullRequests.getAll({
                    owner: urlParts[0],
                    repo: urlParts[1],
                    state: "all",
                    per_page: 100
                }, function (error, response) {
                    if (error) {
                        var errorObj = json.parse(error.message || error);
                        deferred.reject("Couldn't get the pull requests from the GitHub repository. Error: " + ((errorObj && errorObj.message) || error.message || error));
                    } else {
                        var convertedRequests = [];
                        array.forEach(response.data, function (request) {
                            convertedRequests.push(RequestModel.CreateFromGitHubRequest(request, alreadyLinkedUrls));
                        });
                        deferred.resolve(convertedRequests);
                    }
                });
            }

            return deferred.promise;
        },

        // Get the last 100 merge requests from the selected repository on GitLab
        getRecentGitLabRequests: function (selectedGitRepository, accessToken, alreadyLinkedUrls) {
            var giturl = this._createUrlInformation(selectedGitRepository.url);
            var deferred = new Deferred();

            var gitlab = new this.gitLabApi({
                url: giturl.origin,
                token: accessToken,
                useXMLHttpRequest: true
            });

            if (giturl.parts.length < 2) {
                deferred.reject("Invalid repository URL.");
            } else {
                gitlab.MergeRequests.all({
                    projectId: giturl.joined,
                    max_pages: 1,
                    per_page: 100
                }).then(function (response) {
                    var convertedRequests = [];
                    array.forEach(response, function (request) {
                        convertedRequests.push(RequestModel.CreateFromGitLabRequest(request, alreadyLinkedUrls));
                    });
                    deferred.resolve(convertedRequests);
                }, function (error) {
                    deferred.reject("Couldn't get the merge requests from the GitLab repository. Error: " + (error.message || (error.error && error.error.message) || error.error || error));
                });
            }

            return deferred.promise;
        },

        determineRepositoryGitHost: function (selectedGitRepository) {
            var self = this;
            var deferred = new Deferred();
            var repositoryUrl = new url(selectedGitRepository.url);
            var lowerCaseHost = repositoryUrl.host.toLowerCase();

            // Check if the host is github (the github url doesn't vary)
            if (lowerCaseHost === "github.com") {
                deferred.resolve(this.gitHosts.gitHubHost);
            } else if (lowerCaseHost === "gitlab.com") {
                // Check for gitlab.com directly. This is for two reasons:
                // 1. It also is a static url
                // 2. Requesting a repository from gitlab.com is quite slow.
                //    Other gitlab instances are generally faster and there is
                //    no way to statically check for them.
                deferred.resolve(this.gitHosts.gitLabHost);
            } else {
                // Make a request to a gitlab api endpoint. If the request is
                // successful, assume that the repository is hosted on a gitlab instance
                this.isGitLabRepository(repositoryUrl).then(function (statusOk) {
                    if (statusOk) {
                        deferred.resolve(self.gitHosts.gitLabHost);
                    } else {
                        deferred.resolve(self.gitHosts.otherGitHost);
                    }
                });
            }

            return deferred.promise;
        },

        // Make a request for a single public project from the gitlab api.
        // Return true if the request was successful, otherwise false.
        isGitLabRepository: function (gitRepositoryUrl) {
            return xhr.get(this._getOriginFromUrlObject(gitRepositoryUrl) + "/api/v4/projects", {
                query: {
                    per_page: 1
                },
                handleAs: "json",
                headers: {
                    "Accept": "application/json"
                }
            }).then(function (response) {
                return true;
            }, function (error) {
                return false;
            });
        },

        // Check if the access token works for the specified host type
        checkAccessToken: function (gitRepositoryUrl, gitHost, accessToken) {
            var deferred = new Deferred();

            if (gitHost.name === this.gitHubString) {
                // Check access token with GitHub
                var github = new this.gitHubApi({
                    auth: accessToken
                });
                github.users.get({}, function (error, response) {
                    if (error) {
                        deferred.resolve(false);
                    } else {
                        deferred.resolve(true);
                    }
                });
            } else if (gitHost.name === this.gitLabString) {
                // Check access token with GitLab
                var gitlab = new this.gitLabApi({
                    url: this._getOriginFromUrlObject(gitRepositoryUrl),
                    token: accessToken,
                    useXMLHttpRequest: true
                });
                gitlab.Users.current().then(function (response) {
                    if (response) deferred.resolve(true);
                    else deferred.resolve(false);
                }, function (error) {
                    deferred.resolve(false);
                });
            } else {
                deferred.reject("Invalid git host.");
            }

            return deferred.promise;
        },

        // Gets the origin without a trailing slash
        _getOriginFromUrlObject: function (url) {
            return url.scheme + "://" + url.host + (url.port ? ":" + url.port : "");
        },

        // Remove the ".git" suffix from the repository name if present
        _removeDotGitEnding: function (repositoryName) {
            return repositoryName.replace(/\.git$/, '');
        },

        // Returns an array of non empty url parts taken from the specified url path
        _getUrlPartsFromPath: function (urlPath) {
            return urlPath.split('/').filter(function (part) {
                return part; // Remove empty parts (initial slash).
            });
        },

        // Remove pull requests from the list of issues provided by the GitHub API.
        // The GitHub API counts pull requests as issues. This also means that when
        // requesting 100 issues we actually get less because some of them are pull
        // requests. This shouldn't be a problem most of the time but may need to be
        // addressed in the future if there are repositories with a too high pull
        // requests to issues ratio.
        _removePullRequestsFromIssuesList: function (issues) {
            return issues.filter(function (issue) {
                return !issue.pull_request;
            });
        }
    });

    // Returns an instance so that you don't need to instantiate this class.
    // It's functions can be called directly after importing. Example:
    //      GitRestService.getInstance();
    //      GitRestService.destroyInstance();
    //
    // This is basically a singleton that can be asked to use a new instance when needed
    return new function () {
        // Gets the existing instance or creates one if none exists (singleton)
        this.getInstance = function () {
            if (!_instance) {
                _instance = new GitRestService();
            }

            return _instance;
        };

        // Destroys the existing instance. It doesn't matter if none exists.
        // This causes the next call to getInstance to create a new instance
        this.destroyInstance = function () {
            _instance = null;
        };
    };
});