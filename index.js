(function () {
    'use strict';

    class MediaExtractor {
        getInstagramMedia() {
            // Data object is different depending on if you're logged in or not.
            let data = null;
            if (__additionalData[location.pathname]) {
                data = __additionalData[location.pathname].data.graphql.shortcode_media;
            } else {
                data = _sharedData.entry_data.PostPage[0].graphql.shortcode_media;
            }

            if (data !== null) {
                if (data.edge_sidecar_to_children) { // Multi-media post
                    return data.edge_sidecar_to_children.edges
                        .map(edge => edge.node.is_video ? edge.node.video_url : edge.node.display_url);
                } else if (data.is_video) { // Single-video post
                    return [data.video_url];
                }

                // Single-image post
                return [data.display_url];
            }

            return [];
        }
        getInstagramStoryMedia() {
            let videos = document.getElementsByTagName('video');
            if (videos.length > 0) {
                return [videos[0].currentSrc];
            }

            return [document.getElementsByTagName('img')[navigator.userAgent.includes("Mobile") ? 0 : 1].src];
        }
        getTikTokMedia() {
            return [document.getElementsByTagName('video')[0].src];
        }
        getTwitterMedia() {
            return document.querySelectorAll('img[src*="format"]')
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')));
        }
        getVscoMedia() {
            let videos = document.querySelectorAll('meta[property="og:video"]');
            if (videos.length > 0) {
                return [videos[0].content];
            }

            let image = document.querySelectorAll('meta[property="og:image"]')[0].content;
            return [image.substring(0, image.lastIndexOf('?'))];
        }
        getMedia() {
            let host = location.host;
            let path = location.pathname;

            if (host.includes('instagram.com')) {
                if (path.startsWith('/stories/')) {
                    return this.getInstagramStoryMedia();
                } else if (path.startsWith('/p/') || path.startsWith('/tv/')) {
                    return this.getInstagramMedia();
                }
            } else if (host.includes('tiktok.com')) {
                return this.getTikTokMedia();
            } else if (host.includes('twitter.com')) {
                return this.getTwitterMedia();
            } else if (host.includes('vsco.co')) {
                return this.getVscoMedia();
            }

            return [];
        }
    };

    (window.MediaExtractor = new MediaExtractor()).getMedia().forEach(url => {
        console.log(url);
        window.open(url, '_blank');
    });
})();