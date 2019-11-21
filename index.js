(function (global) {
    'use strict';

    class MediaExtractor {
        getInstagramMedia() {
            let postUrls = new Set();

            // Post data object depends on if you're logged in or not.
            let postData = global.__additionalData[location.pathname];
            if (postData) {
                postData = global.__additionalData[location.pathname].data.graphql.shortcode_media;
            } else {
                postData = global._sharedData.entry_data.PostPage[0].graphql.shortcode_media;
            }

            // Multi-media posts
            if (postData.edge_sidecar_to_children) {
                postData.edge_sidecar_to_children.edges.forEach(edge => {
                    let node = edge.node;
                    if (node.video_url) {
                        postUrls.add(node.video_url);
                    } else {
                        postUrls.add(node.display_url);
                    }
                });
            }

            // Single-media posts
            if (postData.is_video) {
                postUrls.add(postData.video_url);
            } else {
                postUrls.add(postData.display_url);
            }

            return postUrls;
        }
        getInstagramStoryMedia() {
            let videos = document.querySelectorAll('video');
            if (videos.length > 0) {
                // Why use currentSrc over src?
                return [videos[0].currentSrc];
            }
            
            return [document.querySelectorAll('img')[1].src];
        }
        getTikTokMedia() {
            return [document.querySelectorAll('video')[0].src];
        }
        getTwitterMedia() {
            let postUrls = new Set();

            document.querySelectorAll('img[src*="format"').forEach(elem => postUrls.add(elem.src.substring(0, elem.src.lastIndexOf('&name='))));

            return postUrls;
        }
        getVscoMedia() {
            let videos = document.querySelectorAll('meta[property="og:video"');
            if (videos.length > 0) {
                return [videos[0].content];
            }
            
            let imageUrl = document.querySelectorAll('meta[property="og:image"')[0].content;
            return [imageUrl.substring(0, imageUrl.lastIndexOf('?h='))];
        }
        getMedia() {
            let host = location.host;
            let path = location.pathname;
            
            if (host.includes('instagram.com')) {
                if (path.startsWith('/stories/')) {
                    return this.getInstagramStoryMedia();
                } else if (path.startsWith('/p/')) {
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

    (global.MediaExtractor = new MediaExtractor()).getMedia().forEach(url => {
        console.log(url);
        window.open(url, '_blank');
    });
})(window);
