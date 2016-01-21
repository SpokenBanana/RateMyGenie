function getRating() {
    // data hasn't been loaded yet
    if (this.rateInfo === undefined) {
        this.innerHTML = '<input class="showRating" type="button" value="Hide Rating <<<"/>';
        this.show = false;
        // load the data from ratemyprofessor
        loadProfessorData(this);
    }
    // show data again
    else if (this.show) {
        this.rateInfo.className = this.rateInfo.className.substr(0, this.rateInfo.className.lastIndexOf(' '));
        this.innerHTML = '<input class="showRating" type="button" value="Hide Rating <<<"/>';
        this.show = false;
    }
    // hide data
    else {
        this.rateInfo.className += ' hide';
        this.innerHTML = '<input class="showRating" type="button" value="Show Rating!"/>';
        this.show = true;
    }

}

function loadProfessorData(div) {
    div.innerHTML = '<input class="showRating" type="button" value="loading.."/>';
    chrome.runtime.sendMessage({url: div.url}, function(responseText) {
        responseText = responseText.replace('http://blog.ratemyprofessors.com/wp-content/uploads/2015/01/WNOs6.5_RMP_72x72.jpg', '');
        var success = getProfessorData(div, responseText);
        if (!success){
            // try a different variation of their name?
            var splitNames = div.profName.split(' ');
            if (splitNames.length >= 2) {
                var name = splitNames[0] + '+' + splitNames[1];
                var url = 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+north+carolina+at+greensboro&queryoption=HEADER&query=' + name + '&facetSearch=true';
                chrome.runtime.sendMessage({url: url}, function(response) {
                    response= response.replace('http://blog.ratemyprofessors.com/wp-content/uploads/2015/01/WNOs6.5_RMP_72x72.jpg', '');
                    if (!getProfessorData(div, response)) {
                        // professor does not have a ratemyprofessor profile
                        div.innerHTML = 'Not found ):';
                        div.removeEventListener('click', getRating);
                    }
                });
            }
        }
    });
}


// extract the data from the professor's profile
function getProfessorData(div, responseText) {
    var response = document.createElement('div');
    response.innerHTML = responseText;
    var list = response.getElementsByClassName('listing PROFESSOR');

    if (list.length === 0){
        // no professors found
        return false;
    }
    else {
        var link = list[0].getElementsByTagName('a')[0].getAttribute('href');
        var professorURL= 'http://www.ratemyprofessors.com/' + link;

        chrome.runtime.sendMessage({url: professorURL}, function(response){
            response= response.replace('http://blog.ratemyprofessors.com/wp-content/uploads/2015/01/WNOs6.5_RMP_72x72.jpg', '');
            response = response.replace('/assets/chilis/warm-chili.png', '');
            response = response.replace('/assets/chilis/cold-chili.png', '');
            createRateBox(response, div, professorURL);
        });
        return true;
    }
}


function createDiv(classname, text, elements) {
    var element = document.createElement('div');
    element.className = classname;

    if (text !== '')
        element.innerHTML = '<p>' + text + "</p>";

    for (var i = 0; i < elements.length; i++)
        element.appendChild(elements[i]);

    return element;
}


// organize the data into the ratebox
function extractInfo(div, url, responseText) {
    div.className = 'rateBox';
    var page = document.createElement('div');
    page.innerHTML = responseText;
    console.log(page.getElementsByClassName('pfname'));
    if (page.getElementsByClassName('pfname').length === 0) {
        div.appendChild(createDiv("title", 'No ratings yet ): Be the first! <a href="' + url + '" target="_blank"> Click here!</a>', []))
        return false;
    }
    var name = page.getElementsByClassName('pfname')[0].innerText + ' ' + page.getElementsByClassName('plname')[0].innerText;
    var link = document.createElement('a');
    link.href = url;
    link.innerHTML = name;
    link.setAttribute('target', '_blank');

    var count   = page.getElementsByClassName('rating-count')[0].innerText;
    var grades  = page.getElementsByClassName('grade');
    var ratings = page.getElementsByClassName('rating');

    div.appendChild(createDiv('name', '', [link, createDiv('sub', count, [])]));
    div.appendChild(createDiv('title', 'Overall Rating', [createDiv(rankColor(grades[0].innerText), grades[0].innerText, [])]));
    div.appendChild(createDiv('title', 'Average Grade',  [createDiv(rankColor(grades[1].innerText), grades[1].innerText, [])]));
    div.appendChild(createDiv('title', 'Helpfulness',    [createDiv(rankColor(ratings[0].innerText), ratings[0].innerText, [])]));
    div.appendChild(createDiv('title', 'Clarity',        [createDiv(rankColor(ratings[1].innerText), ratings[1].innerText, [])]));
    div.appendChild(createDiv('title', 'Easiness',       [createDiv(rankColor(ratings[2].innerText), ratings[2].innerText, [])]));
}


function rankColor(rank) {
    // give color to the letter grade rating
    if (isNaN(rank)) {
        var letter = rank.substr(0,1);
        if (letter === 'A' || letter === 'B')
            return 'good';
        else if (letter === 'C')
            return 'okay';
        return 'bad';
    }

    rank = parseInt(rank);
    if (rank > 3.9)
        return 'good';
    else if (rank >2.9)
        return 'okay';
    return 'bad';
}


function createRateBox(response, div, professorURL) {
    var rate = document.createElement('div');
    var td = document.createElement('td');
    td.appendChild(rate);

    div.parentElement.parentElement.appendChild(td);
    div.rateInfo = rate;

    extractInfo(rate, professorURL, response);
    div.innerHTML = '<input class="showRating" type="button" value="Hide Rating <<<"/>';
}


// the page has two states, the state we are looking for only has one table that displays the courses
var tables = document.getElementsByClassName('datadisplaytable');
if (tables.length === 1) {
    var table = tables[0];
    var courses = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (var i = 2; i < courses.length; i++) {
        // the 19th element has the professor's name
        var text = courses[i].children[19].innerText;
        if (text === "TBA")
            continue;

        // all of them have some sort of (P) tag on them, so remove it
        var name = text.substr(0, text.indexOf(' ('));
        var fullName = name;
        var names = name.split(' ');

        if (names.length > 2)
            name = names[0] + '+' + names[2];
        else
            name = name.replace(' ', '+');

        var url = 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+north+carolina+at+greensboro&queryoption=HEADER&query=' + name + '&facetSearch=true';

        var div = document.createElement('div');
        div.show = true;
        div.innerHTML = '<input class="showRating" type="button" value="Show Rating!"/>';
        div.profName = fullName;
        div.className = 'rateButton';
        div.url = url;
        div.addEventListener("click", getRating);
        courses[i].children[19].appendChild(div);
    }
}