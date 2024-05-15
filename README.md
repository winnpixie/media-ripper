# media-ripper
Attempts to extract media from social platforms so you can save them.

## !! DISCLAIMER !!
PROJECT ABANDONED.

## Supported Platforms:
* [Instagram](https://instagram.com/) (~~multi+single posts, stories,~~ reel video+audio, ~~IG-TV,~~ profile pictures)
* [TikTok](https://tiktok.com/)
* [Twitter](https://twitter.com/) (images only)
* [VSCO](https://vsco.co/) (images and videos)
* [WeHeartIt](https://weheartit.com/) (images and gifs)

## Use as a UserScript
To run from a UserScript extension such as Tampermonkey or Greasemonkey, install [media-ripper.user.js](media-ripper.user.js).

## Use as an executable Bookmark
Save the following code block as a bookmark to run it from your Bookmarks toolbar
```javascript
javascript:(function(){let s=document.createElement('script');s.type='text/javascript';s.src='https://winnpixie.github.io/media-ripper/media-ripper.user.js';document.head.appendChild(s);})();
```
Note: This bookmarklet will not always work due to `Content Security Policies`. My recommendation is `javascript:` preceding a minified version of [`media-ripper.user.js`](media-ripper.user.js).
