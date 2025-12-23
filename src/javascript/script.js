$(document).ready(function() {
    $('#mobile_btn').on('click', function() {
        $('#mobile_menu').toggleClass('active');
        $('#mobile_btn').find('i').toggleClass('fa-bars fa-x');
    });

    $('#menu').text('Carregando cardápio...');
    loadMenuFromSheets();
});

function loadMenuFromSheets() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOYub5NbfMGBabPgcfUgP2VkdJIUVVATwf1pA1qjp0LGokHBLWpHYx-x3OghWlmiRpzh7ufSbq4WC3/pub?output=csv';

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: 'greedy',
        beforeFirstChunk: function(chunk) {
            const lines = chunk.split(/\r\n|\n|\r/);
            let firstHeaderRow = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('Categoria') && lines[i].includes('Nome do Item')) {
                    firstHeaderRow = i;
                    break;
                }
            }
            if (firstHeaderRow !== -1) {
                return lines.slice(firstHeaderRow).join('\n');
            }
            return chunk;
        },
        transformHeader: header => header.trim(),
        complete: function(results) {
            if (!results || !results.data || results.data.length === 0) {
                $('#menu').text('Não foram encontrados itens no cardápio. Verifique a planilha.');
                return;
            }
            generateMenu(results.data);
        },
        error: function(error, file) {
            console.error('Error loading CSV:', error, file);
            $('#menu').text('Erro ao carregar o cardápio. Verifique a conexão ou o link da planilha.');
        }
    });
}

function generateMenu(data) {
    const menuSection = $('#menu');
    menuSection.empty();

    const categories = {};
    data.forEach(item => {
        if (item && item['Categoria'] && item['Nome do Item']) {
            const category = item['Categoria'].trim();
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(item);
        }
    });

    const categoryCount = Object.keys(categories).length;
    if (categoryCount === 0) {
        menuSection.html('Nenhum item de cardápio válido encontrado. <br><b>Causa provável:</b> Os nomes das colunas na planilha ("Categoria", "Nome do Item", etc.) não correspondem exatamente ao esperado. <br>Por favor, verifique se há erros de digitação ou espaços extras nos cabeçalhos da planilha do Google.');
        return;
    }

    Object.keys(categories).forEach(category => {
        if (category) {
            const categoryTitle = $('<h1>').addClass('beverages_title').html('<br>' + category.toUpperCase());
            const menuItemsDiv = $('<div>').addClass('menu_items');

            categories[category].forEach(item => {
                const itemDiv = $('<div>').addClass(getItemClass(category));

                // Determine the image source: prioritize 'Foto' column, then generate from name
                let imageUrl = generateImagePath(item['Nome do Item']); // Default logic
                if (item['Foto'] && item['Foto'].trim() !== '') {
                    imageUrl = item['Foto'].trim();
                }

                const itemImg = $('<img>')
                    .attr('src', imageUrl)
                    .addClass(getImgClass(category))
                    // Fallback to the default image on any error
                    .on('error', function() { $(this).attr('src', 'src/images/example.png'); });
                
                const itemTitle = $('<h2>').addClass('item-title').text(item['Nome do Item']);
                const itemDesc = $('<p>').addClass(getDescClass(category)).text(item['Descrição']);
                
                const priceString = item['Preço (R$)'];
                let priceText = '';
                if (priceString && !isNaN(parseFloat(priceString))) {
                    priceText = 'R$ ' + parseFloat(priceString).toFixed(2).replace('.', ',');
                }
                const itemBtn = $('<button>').addClass('btn-default').text(priceText);
                
                if (priceText) {
                    itemDiv.append(itemImg, itemTitle, itemDesc, itemBtn);
                } else {
                    itemDiv.append(itemImg, itemTitle, itemDesc);
                }
                menuItemsDiv.append(itemDiv);
            });
            menuSection.append(categoryTitle, menuItemsDiv);
        }
    });
}

function getItemClass(category) {
    const normalized = category.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const classes = { 'HAMBURGUERES': 'hamburguer', 'ACOMPANHAMENTOS': 'acompanhamento', 'BEBIDAS': 'bebida' };
    return classes[normalized] || 'item';
}

function getDescClass(category) {
    const normalized = category.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return normalized === 'BEBIDAS' || normalized === 'ACOMPANHAMENTOS' ? 'item-description_2' : 'item-description';
}

function getImgClass(category) {
    const normalized = category.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const classes = { 'HAMBURGUERES': 'h_img', 'ACOMPANHAMENTOS': 'a_img', 'BEBIDAS': 'b_img' };
    return classes[normalized] || 'img';
}

function generateImagePath(itemName) {
    if (!itemName) return 'src/images/example.png';
    const imageName = itemName.trim().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_').replace(/__/g, '_');
    return `src/images/${imageName}.png`;
}
