/**
 * El script se encarga de crear un encabezado de mensaje de noticias en la página web. Este encabezado se genera dinámicamente a partir de los datos obtenidos de un archivo JSON (`news_message.json`). El encabezado puede mostrar un mensaje, aplicar estilos personalizados y permitir la navegación a un elemento específico en la página al hacer clic en él...
 * 
 * Funcionalidades y parametros:
 *  "text": Permite definir el texto que se mostrará en el encabezado. Puede ser una cadena de texto simple o una referencia a otro archivo JSON o una fecha.
 * "array-index": Permite especificar un índice de un array en caso de que el texto sea un array de datos (text: '$ruta', si apunta a un JSON de actividades recibira un array).
 * "dynamic": Permite definir si el texto es dinámico y se actualiza automáticamente(sirve para cuando pones una fecha en el 'text, en vez de poner la fecha pondrá una cuenta atrás inteligente [puede poner de texto la fecha, cantidad de diads, cuenta a tras de diad:horas:minutos ... ; lo más cómodo para el usuario]).
 * "floating-title": Permite definir un título flotante que se mostrará al pasar el cursor sobre el encabezado.
 * "color": Permite definir el color del texto del encabezado.
 * "decoration": Permite definir la decoración del texto del encabezado (por ejemplo, subrayado).
 * "anchored": Permite definir un selector CSS de un elemento en la página al que se desplazará suavemente al hacer clic en el encabezado.
*/

const dataUrlMessage = "/data/news_message.json";
function parseNewsDate(rawDate) {
    // Devuelve { text, dinamicFree } o null si no hay fecha
    if (!rawDate) return null;

    let data = rawDate.replaceAll("/", "-");
    const parse = data.split("-");
    const dinamicFree = data.indexOf("?") === -1;

    if (parse.length === 2) { // averiguar año-mes-dia
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

    if (newsMessageData.text.indexOf("$") === 0) {
        // ad anchor, by path
        let textData = await fetchJSON(newsMessageData.text.substring(1));
        textData = textData[newsMessageData["array-index"]];

        if (!textData) return;

        if (Array.isArray(textData)) {
            const name = textData[0];
            const description = textData[1];
            const rawDate = textData[2];

            newsMessageHeader.textContent = name;
            newsMessageHeader.title = description;

            const parsed = parseNewsDate(rawDate);
            if (parsed && newsMessageData.dynamic && parsed.dinamicFree) {
                refreshNewsMessageDinamicDate(newsMessageHeader, parsed.text);
            }
        } else if (typeof textData === 'object' && textData !== null) {
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
        const parsed = parseNewsDate(newsMessageData.text);
        if (parsed && newsMessageData.dynamic && parsed.dinamicFree) {
            refreshNewsMessageDinamicDate(newsMessageHeader, parsed.text);
        }
    } else {
        newsMessageHeader.textContent = newsMessageData.text;
    }

    // Anchor event triggered by clicking the news message, sent to the selected element in the body
    if (newsMessageData.anchored) {
        const targetElement = document.querySelector(newsMessageData.anchored);
        if (targetElement) {
            newsMessageHeader.addEventListener('click', () => {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    }

    if (newsMessageData.floatingTitle) {
        // fuerza poner el title que viene en el mensaje, aunque se cambiase antes
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

//actualiza el contenido del mensaje
function refreshNewsMessageDinamicDate(element,date){
    const refreshInterval=setInterval(()=>{
        const endDate = new Date(date);
        const now = new Date();
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) {
            //mismo dia, mostrar mensaje de que esta ocurriendo o ha ocurrido
            if(endDate.getDay()==now.getDay()){
                element.textContent="Es Hoy!"
            }
            else {//para el ciclo de vida del mensaje y lo quita del html. Ese ciclo no se continua durante la misma sesion (es queriendo)
                element.remove()
                clearInterval(refreshInterval)
            }
        }
        else if(((now/1000/60/60/24)-(endDate/1000/60/60/24))<10){//menos de 10dias ,intervalo : (10,0) dias
            element.textContent="En "+(now/1000/60/60/24)-(endDate/1000/60/60/24)+" días"
        }
        else {
            element.textContent=date.replaceAll("-"," /")
        }
    },1000)
}

document.addEventListener('DOMContentLoaded', CreateNewsMessageHeader);