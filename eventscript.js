function showPage(id, info, tab) {
    console.log("hello");
    if (tab.url === "https://banweb.uncg.edu/prod/bwskfcls.P_GetCrse" || tab.url === "https://ssb.uncg.edu/prod/bwskfcls.P_GetCrse") {
        chrome.pageAction.show(id);
    }
}

chrome.tabs.onUpdated.addListener(showPage);

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
        callback(xhr.responseText);
    };

    xhr.onerror = function() {
        callback();
    };

    xhr.open("GET", request.url, true);
    xhr.send();
    return true;
});