(function () {
    'use strict';

    class MediaExtractor {
        getInstagramMedia() {
            let postUrls = new Set();

            // Post data object depends on if you're logged in or not.
            let postData = __additionalData[location.pathname];
            if (postData) {
                postData = __additionalData[location.pathname].data.graphql.shortcode_media;
            } else {
                postData = _sharedData.entry_data.PostPage[0].graphql.shortcode_media;
            }

            // Multi-media posts
            if (postData.edge_sidecar_to_children) {
                postData.edge_sidecar_to_children.edges.map(edge => edge.node).forEach(node => {
                    if (node.video_url) {
                        postUrls.add(node.video_url);
                    } else {
                        postUrls.add(node.display_url);
                    }
                });
            } else {
                // Single-media posts
                if (postData.is_video) {
                    return [postData.video_url];
                } else {
                    return [postData.display_url];
                }
            }

            return postUrls;
        }
        getInstagramStoryMedia() {
            let videos = document.getElementsByTagName('video');
            if (videos.length > 0) {
                return [videos[0].currentSrc];
            }

            return [document.getElementsByTagName('img')[1].src];
        }
        getTikTokMedia() {
            return [document.getElementsByTagName('video')[0].src];
        }
        getTwitterMedia() {
            let postUrls = new Set();

            document.querySelectorAll('img[src*="format"').forEach(elem => postUrls.add(elem.src.substring(0, elem.src.lastIndexOf('&'))));

            return postUrls;
        }
        getVscoMedia() {
            let videos = document.querySelectorAll('meta[property="og:video"');
            if (videos.length > 0) {
                return [videos[0].content];
            }

            let imageUrl = document.querySelectorAll('meta[property="og:image"')[0].content;
            return [imageUrl.substring(0, imageUrl.lastIndexOf('?'))];
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