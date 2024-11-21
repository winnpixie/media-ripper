// ==UserScript==
// @name         media-ripper
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Extract media from social platforms so you can save them locally.
// @author       winnpixie
// @match        https://*.instagram.com/*
// @match        https://*.tiktok.com/*/video/*
// @match        https://*.tiktok.com/v/*
// @match        https://*.twitter.com/*/status/*
// @match        https://*.x.com/*/status/*
// @match        https://*.vsco.co/*/media/*
// @match        https://*.weheartit.com/entry/*
// @grant        none
// @run-at document-start
// ==/UserScript==

(function () {
    'use strict';

    // BEGIN XHR eXtensions
    // BEGIN Event declarations
    class XHREvent {
        constructor(context) {
            this.context = context;
        }
    }

    class XHRFinishedEvent extends XHREvent {
        constructor(context) {
            super(context);
        }
    }
    // END Event declarations

    const XHRExt = {
        finishHandlers: []
    };
    window.XHRExt = XHRExt;

    // BEGIN Prototype hacking
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
                XHRExt.finishHandlers.forEach(handler => handler.call(null, new XHRFinishedEvent(this)));
            }

            if (xhr_onreadystatechange != null) xhr_onreadystatechange.apply(this, arguments);
        };

        xhr_send.apply(this, arguments);
    };
    // END Prototype hacking
    // END XHR eXtensions

    class MediaExtractor {
        extract(path) {
            return []; // Return an empty array by default.
        }

        openMedia(urls) {
            urls.forEach(url => {
                console.log(url);

                open(url, '_blank');
            });
        }
    }

    // FIXME: This is so far broken beyond repair, Meta changes their internal API at least 10 times a week and makes it near impossible to work with.
    class InstagramExtractor extends MediaExtractor {
        getPostMedia() { // FIXME: Find a way to handle Video Blobs.
            return Array.from(document.querySelectorAll('video, img[src*="dst-jpg_e"]'))
                .map(elem => elem.src);
        }

        getReelVideo() { // FIXME: Find a way to handle Video Blobs.
            return [document.getElementsByTagName('video')[0].src];
        }

        // TODO: Is this even available anymore?
        getIGTVVideo() {
            return [document.getElementsByTagName('video')[0].src];
        }

        getStoryMedia() { // FIXME: Find a way to handle Video Blobs.
            return Array.from(document.querySelectorAll('video, img[src*="dst-jpg_e"]'))
                .map(elem => elem.src)
        }

        getProfilePicture() {
            return Array.from(document.getElementsByTagName('img'))
                .map(elem => elem.src)
                .filter(src => src.includes('dst-jpg_s'));
        }

        getReelAudio() {
            return [document.getElementsByTagName('audio')[0].src];
        }

        extract(path) {
            if (path.startsWith('/reels/audio/')) return this.getReelAudio();
            if (path.startsWith('/p/')) return this.getPostMedia();
            if (path.startsWith('/stories/')) return this.getStoryMedia();
            if (path.includes('/reel/')) return this.getReelVideo();
            if (path.startsWith('/tv/')) return this.getIGTVVideo();
            if (path.startsWith('/') && path.length > 1) return this.getProfilePicture();

            return [];
        }
    }

    class TikTokExtractor extends MediaExtractor {
        extract(path) {
            // FIXME: This occasionally returns a .htm file?
            return [document.getElementsByTagName('video')[0].src];
        }
    }

    class TwitterExtractor extends MediaExtractor {
        extract(path) {
            // TODO: Find a way to handle Video Blobs
            return Array.from(document.getElementsByTagName('img'))
                .map(elem => elem.src)
                .filter(src => src.includes('/media/') && src.includes('format'))
                .map(src => src.substring(0, src.lastIndexOf('&')) + '&name=large');
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

        // FIXME: This occasionally prompts a file download?
        extract(path) {
            let video = this.getVideo();
            if (video.length === 1) return video;

            return this.getImage();
        }
    }

    class WeHeartItExtractor extends MediaExtractor {
        extract(path) {
            // NOTE: This seems to double as a watermark bypass, cool, I guess?
            return [document.getElementsByClassName('entry-image')[0].src];
        }
    }

    (window.extractAndOpen = () => {
        let host = location.host;
        let path = location.pathname;
        let extractor = null;

        if (host.includes('instagram.com')) extractor = new InstagramExtractor();
        if (host.includes('twitter.com') || host.includes('x.com')) extractor = new TwitterExtractor();
        if (host.includes('tiktok.com')) extractor = new TikTokExtractor();
        if (host.includes('vsco.co')) extractor = new VSCOExtractor();
        if (host.includes('weheartit.com')) extractor = new WeHeartItExtractor();
        if (extractor == null) return;

        extractor.openMedia(extractor.extract(path));
    })();
})();