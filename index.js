(function () {
    'use strict';

    class MediaExtractor {
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

            // When on mobile the image index is 0 instead of 1 like on desktop, weird.
            return [document.getElementsByTagName('img')[navigator.userAgent.includes('Mobile') ? 0 : 1].src];
        }
        getTikTokMedia() { // NOTE: This returns a .htm file on mobile, external programs are needed for renaming.
            return [document.getElementsByTagName('video')[0].src];
        }
        getTwitterMedia() { // NOTE: Videos require sniffing out XMLHttpRequest connections and external programs, undesirable solution.
            // NOTE: This will also return some images within replies.
            return Array.from(document.querySelectorAll('img[src*="format"]'))
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')));
        }
        getVscoMedia() { // ez-pz reading <meta> tags.
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
                // Posts/IG-TV
                if (path.startsWith('/p/') || path.startsWith('/tv/')) {
                    return this.getInstagramMedia();
                }
                // Stories
                if (path.startsWith('/stories/')) {
                    return this.getInstagramStoryMedia();
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

    (window.MediaExtractor = new MediaExtractor()).getMedia().forEach(url => {
        console.log(url);
        window.open(url, '_blank');
    });
})();