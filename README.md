[![Build Status](https://travis-ci.org/jazz-community/rtc-git-connector.svg?branch=master)](https://travis-ci.org/jazz-community/rtc-git-connector)

# RTC Git Connector
Connect your RTC work items with git commits, issues, and pull/merge requests. Currently, only Gitlab is fully supported.

# Introduction
RTC Git Connector allows tracking your work across different organizational platforms, by including other SCM systems in your team's RTC workflow.

![RTC Git Connector first impression](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/introduction.png)

# Common Usage

RTC Git Connector adds a button to your work item editor view.
![Work item editor button](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/button.png)

Pressing this button will open the actual RTC Git Connector widget, which allows you to interact with git repositories. You will have to choose which repository you would like to work with. The shown repositories must be registred with your Project Area. For more informatino on this, check the Installation and Setup section further down.
![Choosing a repository](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/repository_selection.png)

Choosing a repository will lead to you the main view of the RTC Git Connector. You are given a choice of artifacts that can be linked to your RTC work item. Currently, Commits, Issues and Merge Requests are supported. 

Clicking on an artifact type will present you with a list of artifacts of that type. A green plus means this artifact can be linked, and a greyed-out check means that this artifact has already been linked to the current work item.Artifacts can be searched for and filtered with the provided search and filtering options.
![Listing artifacts](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/main_view.png)

Selecting an item to be linked creates a new list underneath the artifact details, which tracks which artifacts will be linked to the work item once a link has been created. Links in both directions are created when once you save.
![Linking artifacts](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/linking_artifacts.png)

Once links have been created, they show up in the link view, just like any other type of link. Commits are listed separately, whereas Merge Requests and Issues are listed as Related Artifacts. All git links come with rich hover capabilities, showing detailed information of the artifact.
![Work item links](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/links.png)
![Link rich hover with additional information](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/rich_hover.png)

Links to RTC from Gitlab are created as comments on the gitlab artifact.
![Back link to RTC](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/back_link.png)

## Limitations
Currently, Internet Explorer is not supported

Only versions of Gitlab above v9.0 are supported.

# Installation and Setup
## Dependencies
RTC Git Connector requires that both [RTC Git Connector Service](https://github.com/jazz-community/rtc-git-connector-service) and [Secure User Property Store for RTC](https://github.com/jazz-community/rtc-secure-user-property-store) have been **installed** and **properly configured**. These are hard dependencies and RTC Git Connector will not work at all without them being available.

RTC Git Connector has been developed, tested and deployed on RTC versions above 6.0.3.

## Plugin installation
-> LINK TO CURRENT RELEASE <-

RTC Git Connector can be installed like any other plugin provided as an update-site. For detailed instructions, please refer to [this installation section](https://github.com/jazz-community/rtc-create-child-item-plugin#installation).

## Adding external resources to the white list
In order to connect to external services, they have to be added to the white list of the Jazz instance by an administrator.
![White list](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/whitelist.png)

## Registering git repositories
Git repositories that you want to interact with have to be registered with the RTC instance that you are using. IBM provides [detailed instructions](https://jazz.net/help-dev/clm/index.jsp?topic=%2Fcom.ibm.team.connector.cq.doc%2Ftopics%2Ft_git_reg_repo.html) how this can be achieved. All registered repositories will then be visible in the scope they have been registered with.

## Adding access tokens
When a user tries to access a remote repository for the first time, they will be requested to save an access token to enable all interactions with the remote service. Multiple access tokens can be stored per user, for different base urls of external services. Should an access token be revoked, the user will be prompted to save a new, valid, access token the next time they try to access the repository through the RTC Git Connector.
![Access token prompt](https://github.com/jazz-community/rtc-git-connector/blob/master/documentation/access_token.png)

# Contributing
# License

