# Media Extractor
Extracts media from social platforms and opens them in new tabs.

## Currently supported Platforms:
* Instagram
* Twitter
* VSCO

## Use as a UserScript
To run from a UserScript extension such as Tampermonkey or Greasemonkey, append the following to the script's headers
```javascript
// @include *://*instagram.com/p/*
// @include *://*instagram.com/stories/*
// @include *://*twitter.com/*/status/*
// @include *://*vsco.co/*/media/*
// @require https://alerithe.github.com/MediaExtractor/index.js
```

## Use as an executable Bookmark
Save the following code block as a bookmark to run it from your Bookmarks toolbar
```javascript
javascript:(function(){var s=document.createElement("script");s.src="https://alerithe.github.io/MediaExtractor/index.js";document.head.appendChild(s);})();
```
Note: This bookmarklet will not always work due to `Content Security Policies`. A more reliable URL is `javascript:` preceding a minified version of [`index.js`](https://github.com/MediaExtractor/index.js)
