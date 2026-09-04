/**
 * This script creates a news message header on the web page. This header is generated dynamically from data obtained from a JSON file (`news_message.json`). The header can display a message, apply custom styles and allow navigation to a specific element on the page when clicked on...
 *
 * Features and parameters:
 *  "text": Allows defining the text that will be shown in the header. It can be a simple text string, a reference to another JSON file, or a date.
 * "array-index": Allows specifying an array index in case the text is an array of data (text: '$path', if it points to an activities JSON it will receive an array).
 * "dynamic": Allows defining whether the text is dynamic and updates automatically (used for when you put a date in 'text'; instead of showing the date it will show a smart countdown [it can show as text the date, number of days, countdown of days:hours:minutes ... ; whatever is most convenient for the user]).
 * "floating-title": Allows defining a floating title that will be shown when hovering over the header.
 * "color": Allows defining the text color of the header.
 * "decoration": Allows defining the text decoration of the header (for example, underline).
 * "anchored": Allows defining a CSS selector of an element on the page that will be smoothly scrolled to when clicking the header.
*/

const dataUrlMessage = "/data/news_message.json";
function parseNewsDate(rawDate) {
    // Returns { text, dinamicFree } or null if there is no date
    if (!rawDate) return null;

    let data = rawDate.replaceAll("/", "-");
    const parse = data.split("-");
    const dinamicFree = data.indexOf("?") === -1;

    if (parse.length === 2) { // figure out year-month-day
        let año, mes, dia;

        for (const part of parse) {
            if (part.length === 4 && !año) {
                año = part;
            } else if (Number(part) > 12) {
                dia = part;
            } else if (dia !== undefined && !mes) {
                mes = part;
            }
        }

        if (!año) {
            año = new Date().getFullYear();
        }

        if (!dia && !mes) {
            dia = parse[0];
            mes = parse[1];
        }

        data = `${dia}-${mes}-${año}`;
    }

    return { text: data, dinamicFree: parse.length === 1 ? false : dinamicFree };
}

function parseNewsDate(rawDate) {
    // Returns { text, dinamicFree } or null if there is no date
    if (!rawDate) return null;

    let data = rawDate.replaceAll("/", "-");
    const parse = data.split("-");
    const dinamicFree = data.indexOf("?") === -1;

    if (parse.length === 2) { // figure out year-month-day
        let año, mes, dia;

        for (const part of parse) {
            if (part.length === 4 && !año) {
                año = part;
            } else if (Number(part) > 12) {
                dia = part;
            } else if (dia !== undefined && !mes) {
                mes = part;
            }
        }

        if (!año) {
            año = new Date().getFullYear();
        }

        if (!dia && !mes) {
            dia = parse[0];
            mes = parse[1];
        }

        data = `${dia}-${mes}-${año}`;
    }

    return { text: data, dinamicFree: parse.length === 1 ? false : dinamicFree };
}

async function CreateNewsMessageHeader() {
    const newsMessageData = await fetchJSON(dataUrlMessage);
    if (!newsMessageData || !newsMessageData.text || typeof newsMessageData.text !== 'string') return;

    // create the newsMessageHeader component in the header
    const newsMessageHeaderElement = document.createElement('div');
    newsMessageHeaderElement.className = 'news-message-header';
    document.querySelector("header").appendChild(newsMessageHeaderElement);

    const newsMessageHeader = newsMessageHeaderElement;

    newsMessageHeader.style.color = newsMessageData.color || '#326e76';
    newsMessageHeader.style.textDecoration = newsMessageData.decoration || '';

    if (newsMessageData.text.trim() === '') return;

    let newsName; // name of the news item, used later as anchor fallback

    if (newsMessageData.text.indexOf("$") === 0) {
        // ad anchor, by path
        let textData = await fetchJSON(newsMessageData.text.substring(1));
        textData = textData[newsMessageData["array-index"]];

        if (!textData) return;

        if (Array.isArray(textData)) {
            const name = textData[0];
            const description = textData[1];
            const rawDate = textData[2];

            newsName = name;
            newsMessageHeader.textContent = name;
            newsMessageHeader.title = description;

            const parsed = parseNewsDate(rawDate);
            if (parsed && newsMessageData.dynamic && parsed.dinamicFree) {
                refreshNewsMessageDinamicDate(newsMessageHeader, parsed.text);
            }
        } else if (typeof textData === 'object' && textData !== null) {
            newsName = textData["name"];
            newsMessageHeader.textContent = textData["name"];
            newsMessageHeader.title = textData["date"];

            const parsed = parseNewsDate(textData["date"]);
            if (parsed && newsMessageData.dynamic && parsed.dinamicFree) {
                refreshNewsMessageDinamicDate(newsMessageHeader, parsed.text);
            }
        } else {
            return;
        }
    } else if (!isNaN(Date.parse(newsMessageData.text))) {
        // ad anchor, by date
        const parsed = parseNewsDate(newsMessageData.text);
        if (parsed && newsMessageData.dynamic && parsed.dinamicFree) {
            refreshNewsMessageDinamicDate(newsMessageHeader, parsed.text);
        }
    } else {
        newsMessageHeader.textContent = newsMessageData.text;
    }

    // Anchor event triggered by clicking the news message, sent to the selected element in the body
    let targetElement;
    if (newsMessageData.anchored) {
        targetElement = document.querySelector(newsMessageData.anchored);
    } else if (newsName) {
        // no explicit selector: anchor to the news item whose title matches
        targetElement = Array.from(document.body.querySelectorAll(".activity-link"))
            .find(el => el.querySelector(".activity-name")?.textContent === newsName);
    }

    if (targetElement) {
        newsMessageHeader.addEventListener('click', () => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    if (newsMessageData.floatingTitle) {
        // force setting the title that comes in the message, even if it was changed before
        newsMessageHeader.title = newsMessageData.floatingTitle;
    }
}
const fetchJSON2 = async (dataUrl) => {

    const response = await fetch(dataUrl);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
};

//updates the content of the message
function refreshNewsMessageDinamicDate(element,date){
    const refreshInterval=setInterval(()=>{
        const endDate = new Date(date);
        const now = new Date();
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) {
            //same day, show message that it is happening or has happened
            if(endDate.getDay()==now.getDay()){
                element.textContent="Es Hoy!"
            }
            else {//stops the message lifecycle and removes it from the html. This cycle does not continue during the same session (intentionally)
                element.remove()
                clearInterval(refreshInterval)
            }
        }
        else if(((now/1000/60/60/24)-(endDate/1000/60/60/24))<10){//less than 10 days, interval: (10,0) days
            element.textContent="En "+(now/1000/60/60/24)-(endDate/1000/60/60/24)+" días"
        }
        else {
            element.textContent=date.replaceAll("-"," /")
        }
    },1000)
}

document.addEventListener('DOMContentLoaded', CreateNewsMessageHeader);