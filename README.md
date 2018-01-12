[![Build Status](https://travis-ci.org/jazz-community/rtc-git-connector.svg?branch=master)](https://travis-ci.org/jazz-community/rtc-git-connector)

# RTC Git Connector
Connect your RTC work items with git commits, issues, and pull/merge requests.
Works with GitHub and GitLab (starting with v9.0)


This is the initial release of the rtc-git-connector widget for the IBM Jazz RTC work item editor.

Here is a short list of some of the functionality included in this version:

- View registered git repositories in Jazz RTC
- Save and use an access token per git host system
- View recently created commits, issues, and pull/merge requests
- Filter commits, issues, and requests (with text highlighting)
- Search for any commit, issue, or request by sha/id (for the selected git repository)
- Chose what to link (can link to multiple commits, issues, and requests at once)
- Save the links on the work item
- Create a comment on every linked commit, issue, and request with a link pointing back to the work item
- Works with repositories hosted on GitHub and GitLab (v9.0 and up)
- Works with both public and private repositories (so long as the user has access and their token is valid)

Limitations

- Doesn't run in Internet Explorer (for now)
- Only supports GitHub and GitLab (v9.0 and up) repositories

This version was developed using RTC v6.0.3 but is intended to be compatible with newer versions as well. It has been tested with v6.0.5 and works correctly with that version too.  
It has not been tested with other versions of RTC but may work anyways.

Please report any issues / bugs / feature requests along with the version numbers (RTC, GitLab, connector widget, ...) in the issues section of this repository.
