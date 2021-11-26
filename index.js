/**
 * socialrip - Attempts to extract media from social platforms so you can save them.
 * Author: Summer (https://github.com/alerithe)
 * Source: https://github.com/alerithe/socialrip/
 */
(function () {
    'use strict';

    const retrieveMedia = () => {
        let host = location.host;
        let path = location.pathname;

        if (host.includes('instagram.com')) { // NOTE: __additionalData = logged in, _sharedData = logged out
            if (path.startsWith('/p/') || path.startsWith('/tv/') || path.startsWith('/reel/')) { // Posts, IGTV, Reels
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
            } else if (path.startsWith('/stories/')) { // Stories, requires user to be logged in.
                let videos = document.getElementsByTagName('video');
                if (videos.length > 0) {
                    return [videos[0].currentSrc];
                }

                let img = document.getElementsByTagName('img')[0];
                if (img.srcset) {
                    return [img.srcset.split(' ')[0]];
                }

                // Doesn't always return the whole image, what?
                return [img.src];
            } else if (path.startsWith('/') && path.length > 1) { // Profile Image
                return [_sharedData.entry_data.ProfilePage[0].graphql.user.profile_pic_url_hd];
            }
        } else if (host.includes('twitter.com')) { // Twitter, videos are impossible? without the use of external programs and sniffing XHRs.
            return Array.from(document.querySelectorAll('img[src*="format"]'))
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')))
                .filter(src => src.includes('/media/'));
        } else if (host.includes('tiktok.com')) { // TikTok, this will sometimes return a .htm file?
            return [document.getElementsByTagName('video')[0].src];
        } else if (host.includes('vsco.co')) { // VSCO, at least one of these are simple and to the point...
            let video = document.querySelector('meta[property="og:video"]');
            if (video != null) {
                return [video.content];
            }

            let image = document.querySelector('meta[property="og:image"]').content;
            return [image.substring(0, image.lastIndexOf('?'))];
        }

        // Unsupported site or path?
        return [];
    };

    (window.extractAndOpen = () => {
        retrieveMedia().forEach(url => {
            console.log(url);

            window.open(url, '_blank');
        })
    })();
})();