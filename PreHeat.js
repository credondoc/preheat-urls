const axios = require('axios');
const cheerio = require('cheerio');


const urls = [];

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname
    console.log(hostname)
    if (url.indexOf("//") > -1) {
      hostname = url.split('/')[2];
    } else {
      hostname = url.split('/')[0];
    }
    console.log(hostname)
    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];
  
    validateDomain(hostname);
    return hostname;
  }
  
  // Warning: you can use this function to extract the "root" domain, but it will not be as accurate as using the psl package.
  
  function extractRootDomain(url) {
    var domain = extractHostname(url),
    splitArr = domain.split('.'),
    arrLen = splitArr.length;
  
    //extracting the root domain here
    //if there is a subdomain
    if (arrLen > 2) {
      domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
      //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
      if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
        //this is using a ccTLD
        domain = splitArr[arrLen - 3] + '.' + domain;
      }
    }
    validateDomain(domain);
    return domain;
  }
  
  const urlHostname = url => {
    try {
      return new URL(url).hostname;
    }
    catch(e) { return e; }
  };
  
  const validateDomain = s => {
    try {
      new URL("https://" + s);
      return true;
    }
    catch(e) {
      console.error(e);
      return false;
    }
  };

// Función para hacer el scraping
async function crawl(url) {
    try {
        console.log(`Visitando: ${url}`);
        // Descargar el contenido HTML
        const { data } = await axios.get(url);

        // Cargar el HTML en cheerio
        const $ = cheerio.load(data);

        // Obtener el título de la página
        const title = $('title').text();
        console.log(`Título de la página: ${title}`);

        // Extraer los enlaces de la página
        const links = [];
        $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                // Resolver URLs relativas si es necesario
                const absoluteUrl = new URL(href, url).href;
                links.push(absoluteUrl);
            }
        });

        console.log(`Enlaces encontrados (${links.length}):`);

        // Validar cada enlace y mostrar el estado de respuesta
        for (const link of links) {
            try {
                if (!urls.includes(link)) {
                    urls.push(link);
                    const response = await axios.head(link, { timeout: 5000 }); // Usamos HEAD para evitar descargar el contenido
                    console.log(`${link} - Estado: ${response.status}`);
                    console.log(domain)
                    if (link.startsWith(domain)) {
                        crawl(link)
                    }
                }
            } catch (error) {
                if (error.response) {
                    console.log(`${link} - Estado: ${error.response.status}`);
                } else if (error.code === 'ENOTFOUND') {
                    console.log(`${link} - No se pudo resolver el dominio`);
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`${link} - Tiempo de espera agotado`);
                } else {
                    console.log(`${link} - Error desconocido: ${error.message}`);
                }
            }
        }

    } catch (error) {
        console.error(`Error al acceder a la URL: ${error.message}`);
    }
}

// Leer la URL desde los argumentos de la terminal
const url = process.argv[2];

if (!url) {
    console.error('Por favor, proporciona una URL como parámetro. Ejemplo: node crawler.js https://example.com');
    process.exit(1); // Salir del script con error
}

const domain = "https://" + extractHostname(url)

// Llamar a la función con la URL proporcionada
crawl(url);
