(function () {
    class MediaExtractor {
        getInstagramMedia() {
            let postUrls = new Set();

            // Post data object depends on if you're logged in or not.
            let postData = window.__additionalData[window.location.pathname];
            if (postData) {
                postData = window.__additionalData[window.location.pathname].data.graphql.shortcode_media;
            } else {
                postData = window._sharedData.entry_data.PostPage[0].graphql.shortcode_media;
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
            let postUrls = new Set();

            let videos = document.querySelectorAll("video");
            if (videos.length > 0) {
                // Don't get why they dont just use src, but whatever
                postUrls.add(videos[0].currentSrc);
            } else {
                postUrls.add(document.querySelectorAll("img")[1].src);
            }

            return postUrls;
        }
        getTwitterMedia() {
            let postUrls = new Set();

            document.querySelectorAll("img[src*=\"format\"").forEach(elem => postUrls.add(elem.src.substring(0, elem.src.lastIndexOf("&name="))));

            return postUrls;
        }
        getVscoMedia() {
            let postUrls = new Set();

            // Grab videos instead of thumbnails if videos exist
            let videoUrl = document.querySelectorAll("meta[property=\"og:video\"");
            if (videoUrl.length > 0) {
                postUrls.add(document.querySelectorAll("meta[property=\"og:video\"")[0].content);
            } else {
                let imageUrl = document.querySelectorAll("meta[property=\"og:image\"")[0].content;
                postUrls.add(imageUrl.substring(0, imageUrl.lastIndexOf("?h=")));
            }

            return postUrls;
        }
        getMedia() {
            if (window.location.host.includes("instagram.com")) {
                if (window.location.pathname.startsWith("/stories")) {
                    return this.getInstagramStoryMedia();
                } else {
                    return this.getInstagramMedia();
                }
            } else if (window.location.host.includes("twitter.com")) {
                return this.getTwitterMedia();
            } else if (window.location.host.includes("vsco.co")) {
                return this.getVscoMedia();
            }
            return [];
        }
    };

    (new MediaExtractor()).getMedia().forEach(url => {
        console.log(url);
        window.open(url, "_blank");
    });
})();
