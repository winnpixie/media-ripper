/*
 * socialrip - Attempts to extract media from social platforms so you can save them.
 * Author: Sativa (https://github.com/suhtiva)
 * Source: https://github.com/suhtiva/socialrip/
 */
(function () {
    'use strict';

    const retrieveMedia = () => {
        let host = location.host;
        let path = location.pathname;

        if (host.includes('instagram.com')) {
            if (path.startsWith('/p/') || path.startsWith('/tv/') || path.includes('/reel/')) { // Posts, IG-TV, Reels
                let sr_sharedData = window._sharedData;
                if (sr_sharedData == null) {
                    let sharedDataHeader = 'window._sharedData = ';
                    for (let docScr of document.scripts) {
                        if (docScr.text.startsWith(sharedDataHeader)) {
                            sr_sharedData = JSON.parse(docScr.text.substring(sharedDataHeader.length, docScr.text.length - 2));
                            break;
                        }
                    }
                }

                if (sr_sharedData.config.viewer == null) { // Not logged in
                    let postData = sr_sharedData.entry_data.PostPage[0].graphql.shortcode_media;
                    if (postData.edge_sidecar_to_children != null) { // Multi-media post
                        return postData.edge_sidecar_to_children.edges
                            .map(edge => edge.node.is_video ? edge.node.video_url : edge.node.display_url);
                    }

                    return postData.is_video ? [postData.video_url] : [postData.display_url];
                }

                let dataObject = window.__additionalData[location.pathname];
                if (dataObject != null && dataObject.data != null) {
                    dataObject = dataObject.data;
                } else {
                    let addtionalDataHeader = `window.__additionalDataLoaded('${location.pathname}',`;
                    for (let docScr of document.scripts) {
                        if (docScr.text.startsWith(addtionalDataHeader)) {
                            dataObject = JSON.parse(docScr.text.substring(addtionalDataHeader.length, docScr.text.length - 2));
                            break;
                        }
                    }
                }

                let postData = dataObject.items[0];
                if (postData.carousel_media != null) {
                    return postData.carousel_media
                        .map(media => media.media_type == 2 ? media.video_versions[0].url : media.image_versions2.candidates[0].url);
                }

                return [postData.media_type == 2 ? postData.video_versions[0].url : postData.image_versions2.candidates[0].url];
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
            } else if (path.startsWith('/reels/audio/')) { // Reels Audio
                return [document.getElementsByTagName('audio')[0].src];
            } else if (path.startsWith('/') && path.length > 1) { // Profile Image
                return [window._sharedData.entry_data.ProfilePage[0].graphql.user.profile_pic_url_hd];
            }
        } else if (host.includes('twitter.com')) { // Twitter, videos are impossible? without the use of external programs and sniffing XHRs.
            return Array.from(document.querySelectorAll('img[src*="format"]'))
                .map(elem => elem.src.substring(0, elem.src.lastIndexOf('&')) + '&name=large')
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