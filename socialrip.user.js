// ==UserScript==
// @name         socialrip
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Hannah
// @include *://*instagram.com/*
// @include *://*tiktok.com/*/video/*
// @include *://*tiktok.com/v/*
// @include *://*twitter.com/*/status/*
// @include *://*vsco.co/*/media/*
// @grant        none
// @run-at document-start
// ==/UserScript==

/*
 * socialrip - Attempts to extract media from social platforms so you can save them.
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

    const retrieveMedia = () => {
        let host = location.host;
        let path = location.pathname;

        if (host.includes('instagram.com')) {
            if (path.startsWith('/p/') || path.startsWith('/tv/') || path.includes('/reel/')) {
                window.XHRX.onCompleted.push(xhr => {
                    if (!xhr.xUrl.endsWith('/info/')) return;

                    let json = JSON.parse(xhr.responseText);
                    let data = json.items[0];

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
            } else if (path.startsWith('/reels/audio/')) {
                return [document.getElementsByTagName('audio')[0].src];
            } else if (path.startsWith('/stories/')) {
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
            } else if (path.startsWith('/') && path.length > 1) {
                window.XHRX.onCompleted.push(xhr => {
                    if (xhr.xUrl.includes('/users/web_profile_info/')) {
                        let json = JSON.parse(xhr.responseText);
                        displayMedia([json.data.user.profile_pic_url_hd]);
                    }
                });
            }
        }

        if (host.includes('twitter.com')) {
            // TODO: Figure out a way to extract videos?
            return Array.from(document.querySelectorAll('img[src*="format"]'))
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')) + '&name=large')
                .filter(src => src.includes('/media/'));
        }

        if (host.includes('tiktok.com')) {
            // FIXME: This occasionally returns a .htm file?
            return [document.getElementsByTagName('video')[0].src];
        }

        if (host.includes('vsco.co')) {
            let video = document.querySelector('meta[property="og:video"]');
            if (video != null) return [video.content];

            let image = document.querySelector('meta[property="og:image"]').content;
            return [image.substring(0, image.lastIndexOf('?'))];
        }

        // Unsupported site or path? (or we are waiting for XHRs)
        return [];
    };

    const displayMedia = urls => {
        urls.forEach(url => {
            console.log(url);
            window.open(url, '_blank');
        });
    };

    (window.extractAndOpen = () => {
        displayMedia(retrieveMedia());
    })();
})();