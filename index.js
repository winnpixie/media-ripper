/*
 * SocialRip - Extracts media from various social platforms and attempts to open them in new tabs.
 * Author: Summer (https://github.com/alerithe)
 * Source: https://github.com/alerithe/socialrip/
 */
(function () {
    'use strict';

    class SocialRip {
        getInstagramMedia() {
            let dataObject = __additionalData[location.pathname];
            let post = dataObject != null ? dataObject.data.graphql.shortcode_media // Logged in
                : _sharedData.entry_data.PostPage[0].graphql.shortcode_media; // Not logged in

            if (post != null) {
                if (post.edge_sidecar_to_children != null) { // Multi-media post
                    return post.edge_sidecar_to_children.edges
                        .map(edge => edge.node.is_video ? edge.node.video_url : edge.node.display_url);
                }
                return post.is_video ? [post.video_url] : [post.display_url];
            }

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
                return [document.getElementsByTagName('img')[0].srcset.split(' ')[0]];
            }

            // Returns a square image sometimes instead of the full picture. lolwut
            return [img.src];
        }
        getInstagramProfilePicture() {
            return [_sharedData.entry_data.ProfilePage[0].graphql.user.profile_pic_url_hd];
        }
        getTikTokMedia() { // (Possibly invalid) NOTE: This returns a .htm file on mobile, external programs are needed for renaming.
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
                // Profile ?
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