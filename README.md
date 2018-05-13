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
RTC Git Connector requires that both [RTC Git Connector Service](https://github.com/jazz-community/rtc-git-connector-service) and [Secure User Property Store for RTC](https://github.com/jazz-community/rtc-secure-user-property-store) have been installed and properly configured. These are hard dependencies and RTC Git Connector will not work at all without them being available.

RTC Git Connector has been developed, tested and deployed on RTC versions above 6.0.3.

## Plugin installation
## Registering git repository
## Adding access tokens
## Linking artifacts
# Contributing
# License

