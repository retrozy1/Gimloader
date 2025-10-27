const oldPathRegex = /^https:\/\/raw.githubusercontent\.com\/Gimloader\/client-plugins\/(?:refs\/heads\/)?main\/(plugins|libraries)(?:\/\w+\/build)?\/(\w+\.js)$/g;
export function formatDownloadUrl(url: string) {
    // migrate from TheLazySquid/Gimloader -> Gimloader/client-plugins
    url = url.replace("https://raw.githubusercontent.com/TheLazySquid/Gimloader", "https://raw.githubusercontent.com/Gimloader/client-plugins");

    // migrate structure of client-plugins repo
    url = url.replace(oldPathRegex, "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/$1/$2");

    return url;
}