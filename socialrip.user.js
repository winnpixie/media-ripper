// ==UserScript==
// @name         socialrip
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Extract media from social platforms so you can save them locally.
// @author       Hannah
// @match        https://*.instagram.com/*
// @match        https://*.tiktok.com/*/video/*
// @match        https://*.tiktok.com/v/*
// @match        https://*.twitter.com/*/status/*
// @match        https://*.vsco.co/*/media/*
// @match        https://*.weheartit.com/entry/*
// @grant        none
// @run-at document-start
// ==/UserScript==

/*
 * socialrip - Extract media from social platforms so you can save them locally.
 * Author: Hannah (https://github.com/winnpixie)
 * Source: https://github.com/winnpixie/socialrip/
 */
(function () {
    'use strict';

    // BEGIN XHR eXtensions
    window.XHRX = {
        onCompleted: []
    };

    const xhr_open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.xUrl = arguments[1];

        xhr_open.apply(this, arguments);
    };

    const xhr_send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        const xhr_onreadystatechange = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                window.XHRX.onCompleted.forEach(action => action(this));
            }

            if (xhr_onreadystatechange != null) xhr_onreadystatechange.apply(this, arguments);
        };

        xhr_send.apply(this, arguments);
    };
    // END XHR eXtensions

    class MediaExtractor {
        extract() {
            return []; // Return an empty array by default.
        }
    }

    class InstagramExtractor extends MediaExtractor {
        getPostMedia() { // Boilerplate for if I ever need to separate methods.
            this.getGenericMedia();
        }

        getReelVideo() { // Boilerplate for if I ever need to separate methods.
            this.getGenericMedia();
        }

        getIGTVVideo() { // Boilerplate for if I ever need to separate methods.
            this.getGenericMedia();
        }

        getGenericMedia() {
            window.XHRX.onCompleted.push(xhr => {
                if (!xhr.xUrl.endsWith('/api/graphql')) return;

                let json = JSON.parse(xhr.responseText);
                let data = json.data.xdt_api__v1__media__shortcode__web_info.items[0];

                switch (data.media_type) {
                    case 1: // Images
                        displayMedia([data.image_versions2.candidates[0].url]);
                        break;
                    case 2: // Videos
                        displayMedia([data.video_versions[0].url]);
                        break;
                    case 8: // Multi-media (images+videos)
                        displayMedia(data.carousel_media.map(item => {
                            switch (item.media_type) {
                                case 1:
                                    return item.image_versions2.candidates[0].url;
                                case 2:
                                    return item.video_versions[0].url;
                            }
                        }));
                }
            });
        }

        getReelAudio() {
            return [document.getElementsByTagName('audio')[0].src];
        }

        getStoryMedia() {
            window.XHRX.onCompleted.push(xhr => {
                if (xhr.xUrl.includes('/story/') || xhr.xUrl.includes('/feed/reels_media/')) {
                    let json = JSON.parse(xhr.responseText);

                    let data = json.reel;
                    if (json.reels_media != null) data = json.reels_media[0];

                    displayMedia(data.items.map(media => {
                        switch (media.media_type) {
                            case 1:
                                return media.image_versions2.candidates[0].url;
                            case 2:
                                return media.video_versions[0].url;
                        }
                    }));
                }
            });
        }

        getProfilePicture() {
            window.XHRX.onCompleted.push(xhr => {
                if (!xhr.xUrl.includes('/users/web_profile_info/')) return;

                let json = JSON.parse(xhr.responseText);
                displayMedia([json.data.user.profile_pic_url_hd]);
            });
        }

        extract() {
            // All of these except for Reel Audio are callback based :/
            return [];
        }
    }

    class TikTokExtractor extends MediaExtractor {
        extract() {
            // FIXME: This occasionally returns a .htm file?
            return [document.getElementsByTagName('video')[0].src];
        }
    }

    class TwitterExtractor extends MediaExtractor {
        extract() {
            // TODO: Figure out a way to extract videos?
            return Array.from(document.querySelectorAll('img[src*="format"]'))
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')) + '&name=large')
                .filter(src => src.includes('/media/'));
        }
    }

    class VSCOExtractor extends MediaExtractor {
        getVideo() {
            let video = document.querySelector('meta[property="og:video"]');
            if (video == null) return [];

            return [video.content];
        }

        getImage() {
            let image = document.querySelector('meta[property="og:image"]').content;
            return [image.substring(0, image.lastIndexOf('?'))];
        }

        extract() {
            let video = this.getVideo();
            if (video.length < 1) return this.getImage();

            return video;
        }
    }

    class WeHeartItExtractor extends MediaExtractor {
        extract() {
            // TODO: This seems to double as a watermark bypass, cool, I guess?
            return [document.getElementsByClassName('entry-image')[0].src];
        }
    }

    const displayMedia = (urls) => {
        urls.forEach(url => {
            console.log(url);

            open(url, '_blank');
        });
    };

    (window.extractAndOpen = () => {
        let host = location.host;
        let path = location.pathname;
        let extractor = null;

        if (host.includes('instagram.com')) {
            extractor = new InstagramExtractor();

            if (path.startsWith('/p/') || path.startsWith('/tv/') || path.includes('/reel/')) {
                extractor.getGenericMedia();
            } else if (path.startsWith('/reels/audio/')) {
                displayMedia(extractor.getReelAudio());
                return;
            } else if (path.startsWith('/stories/')) {
                extractor.getStoryMedia();
            } else if (path.startsWith('/') && path.length > 1) {
                extractor.getProfilePicture();
            }
        }

        if (host.includes('twitter.com')) {
            extractor = new TwitterExtractor();
        }

        if (host.includes('tiktok.com')) {
            extractor = new TikTokExtractor();
        }

        if (host.includes('vsco.co')) {
            extractor = new VSCOExtractor();
        }

        if (host.includes('weheartit.com')) {
            extractor = new WeHeartItExtractor();
        }

        if (extractor == null) return; // Unknown site?

        displayMedia(extractor.extract());
    })();
})();