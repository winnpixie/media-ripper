# socialrip
Extracts media from social platforms and opens them in new tabs.

## Currently supported Platforms:
* [Instagram](https://instagram.com/) (posts, stories, and IGTV)
* [TikTok](https://tiktok.com/)
* [Twitter](https://twitter.com/) (photos only)
* [VSCO](https://vsco.co/)

## Use as a UserScript
To run from a UserScript extension such as Tampermonkey or Greasemonkey, append the following to the script's headers:
```javascript
// @include *://*instagram.com/p/*
// @include *://*instagram.com/tv/*
// @include *://*instagram.com/stories/*
// @include *://*tiktok.com/*/video/*
// @include *://*tiktok.com/v/*
// @include *://*twitter.com/*/status/*
// @include *://*vsco.co/*/media/*
```
Make the script's source code the content of [`index.js`](https://github.com/alerithe/socialrip/blob/master/index.js).

## Use as an executable Bookmark
Save the following code block as a bookmark to run it from your Bookmarks toolbar
```javascript
javascript:(function(){let s=document.createElement("script");s.type="text/javascript";s.src="https://raw.githubusercontent.com/alerithe/socialrip/master/index.js";document.head.appendChild(s);})();
```
Note: This bookmarklet will not always work due to `Content Security Policies`. A more reliable URL is `javascript:` preceding a minified version of [`index.js`](https://github.com/alerithe/socialrip/blob/master/index.js).
