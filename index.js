/**
 * SocialRip - Extracts media from various social platforms and attempts to open them in new tabs.
 * Author: Summer (https://github.com/alerithe)
 * Source: https://github.com/alerithe/socialrip/
 */
(function () {
    'use strict';

    class SocialRip {
        getInstagramMedia() { // NOTE: __additionalData = logged in, _sharedData = logged out
            let post = null;

            try {
                let dataObject = __additionalData[location.pathname];
                post = dataObject != null ? dataObject.data.graphql.shortcode_media : _sharedData.entry_data.PostPage[0].graphql.shortcode_media;
            } catch (e) {
                // An exception should never really be thrown, but some kind of script load priority must be messing up the code above
                let dataObject = null;

                let additionalDataSkip = `window.__additionalDataLoaded('${location.pathname}',`;
                for (let docScr of document.scripts) {
                    if (docScr.text.startsWith(additionalDataSkip)) {
                        dataObject = JSON.parse(docScr.text.substring(additionalDataSkip.length, docScr.text.length - 2));
                        post = dataObject.graphql.shortcode_media;

                        break;
                    }
                }

                if (dataObject == null) {
                    let sharedDataSkip = 'window._sharedData = ';
                    for (let docScr of document.scripts) {
                        if (docScr.text.startsWith(sharedDataSkip)) {
                            dataObject = JSON.parse(docScr.text.substring(sharedDataSkip.length, docScr.text.length - 2));
                            post = dataObject.entry_data.PostPage[0].graphql.shortcode_media;

                            break;
                        }
                    }
                }
            }

            if (post != null) {
                if (post.edge_sidecar_to_children != null) { // Multi-media post
                    return post.edge_sidecar_to_children.edges
                        .map(edge => edge.node.is_video ? edge.node.video_url : edge.node.display_url);
                }

                return post.is_video ? [post.video_url] : [post.display_url];
            }

            // How do we even get here?
            console.log("Are you sure you're on an Instagram post?");
            return [];
        }
        getInstagramStoryMedia() { // NOTE: Stories require you to be logged in.
            let videos = document.getElementsByTagName('video');
            if (videos.length > 0) {
                return [videos[0].currentSrc];
            }

            let img = document.getElementsByTagName('img')[0];
            if (img.srcset) {
                // .srcset possibly contains multiple sizes for the post, not too sure though.
                return [img.srcset.split(' ')[0]];
            }

            // Returns a square image sometimes instead of the full picture. lolwut
            return [img.src];
        }
        getInstagramProfilePicture() {
            return [_sharedData.entry_data.ProfilePage[0].graphql.user.profile_pic_url_hd];
        }
        getTikTokMedia() { // NOTE: This (sometimes?) returns a .htm file on mobile, external programs are needed for renaming.
            return [document.getElementsByTagName('video')[0].src];
        }
        getTwitterMedia() { // NOTE: Videos require sniffing out XMLHttpRequest connections and external programs, undesirable solution.
            // NOTE: This will also return images within replies (fix: limit size to 4?).
            return Array.from(document.querySelectorAll('img[src*="format"]'))
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')))
                .filter(src => src.includes('/media/'));
        }
        getVscoMedia() {
            let video = document.querySelector('meta[property="og:video"]');
            if (video != null) {
                return [video.content];
            }

            let image = document.querySelector('meta[property="og:image"]').content;
            return [image.substring(0, image.lastIndexOf('?'))];
        }
        getMedia() {
            let host = location.host;
            let path = location.pathname;

            // Instagram
            if (host.includes('instagram.com')) {
                // Posts, IG-TV, and Reels
                if (path.startsWith('/p/') || path.startsWith('/tv/') || path.startsWith('/reel/')) {
                    return this.getInstagramMedia();
                }

                // Stories
                if (path.startsWith('/stories/')) {
                    return this.getInstagramStoryMedia();
                }

                // Profiles ?
                if (path.startsWith('/') && path.length > 1) {
                    return this.getInstagramProfilePicture();
                }
            }

            // TikTok
            if (host.includes('tiktok.com')) {
                return this.getTikTokMedia();
            }

            // Twitter
            if (host.includes('twitter.com')) {
                return this.getTwitterMedia();
            }

            // Vsco
            if (host.includes('vsco.co')) {
                return this.getVscoMedia();
            }

            console.log(`${host} is not supported.`);
            return [];
        }
    };

    (window.SocialRip = new SocialRip()).getMedia().forEach(url => {
        console.log(url);

        window.open(url, '_blank');
    });
})();