const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function scrapeAllPagesAndDetails() {
    const results = [];
    const totalPages = 7; // This now means pages 0 through 9

    try {
        // Start from page 0 instead of 1
        for (let page = 0; page < totalPages; page++) {
            console.log(`Scraping page ${page + 1}/${totalPages}...`); // Display as 1-based for readability

            // AJAX request for page data
            const response = await axios.post(
                'https://druglab.fr/wp-admin/admin-ajax.php',
                new URLSearchParams({
                    action: 'recherche_ajax_echantillon_resultat',
                    value: '',
                    page: page // Using 0-based page number
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'X-Requested-With': 'XMLHttpRequest',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0',
                        'Referer': 'https://druglab.fr/resultats/'
                    }
                }
            );

            const data = response.data;
            if (!data.html) {
                throw new Error(`No HTML found in response for page ${page}`);
            }

            const $ = cheerio.load(data.html);

            const analysisPromises = $('.box_resultat').map(async (_, element) => {
                const $el = $(element);
                const link = $el.attr('href') || '';
                
                const titre = $el.find('.titre').text().trim();
                const boughtAs = $el.find('.buy-as .name').text().trim();
                const dateRaw = $el.find('.buy-as .date').text().trim();
                const dateParts = dateRaw.split('/');
                const date = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : 'Non disponible';
                const types = $el.find('.type-resultat img').map((i, el) => $(el).attr('src')).get();
                const risques = $el.find('.risque img').map((i, el) => $(el).attr('src')).get();
                const image = $el.find('img').first().attr('src') || '';

                let analysisData = {
                    titre,
                    boughtAs,
                    date,
                    types,
                    risques,
                    image,
                    page: page + 1, // Store as 1-based for readability
                    link,
                    source: 'DrugLab'
                };

                if (link) {
                    try {
                        const detailResponse = await axios.get(link);
                        const $detail = cheerio.load(detailResponse.data);

                        const composition = [];
                        $detail('.legende li').each((i, el) => {
                            const $li = $detail(el);
                            const quantite = parseInt($li.find('.quantite').text().trim()) || 0;
                            const texte = $li.find('.texte_value').text().trim();
                            composition.push({ substance: texte, value: quantite });
                        });

                        const detailedRisks = [];
                        $detail('.risque-liste li .texte').each((i, el) => {
                            const risqueText = $detail(el).text().trim();
                            detailedRisks.push(risqueText);
                        });

                        const lieuCollecte = $detail('.column.is-narrow div:contains("Lieu de collecte")')
                            .text().replace('Lieu de collecte : ', '').trim();

                        const aspect = [];
                        $detail('.dimensions li').each((i, el) => {
                            const $li = $detail(el);
                            const label = $li.find('.label').text().trim();
                            const value = $li.find('.value').text().trim();
                            aspect.push(`${label} : ${value}`);
                        });

                        const produitsCoupe = composition
                            .filter(c => c.substance.toLowerCase() !== boughtAs.toLowerCase() && c.substance !== 'Inerte')
                            .map(c => c.substance)
                            .join('\n') || 'Aucun produit de coupe détecté';

                        const commentaireElement = $detail('.column.is-4:contains("Commentaire")')
                            .not(':has(h3:contains("Composition"), h3:contains("Produit attendu"), h3:contains("Produit(s) non attendu(s)"), h3:contains("Risques"), h3:contains("Galénique"))')
                            .text().trim();
                        const commentaire = commentaireElement.replace('Commentaire', '').trim() || '';

                        analysisData = {
                            ...analysisData,
                            composition,
                            detailedRisks,
                            lieuCollecte,
                            aspect,
                            produitsCoupe,
                            commentaire
                        };
                    } catch (detailError) {
                        console.error(`Error fetching details for ${link}:`, detailError.message);
                    }
                }

                return analysisData;
            }).get();

            const pageResults = await Promise.all(analysisPromises);
            results.push(...pageResults);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await fs.writeFile('resultats_analyses_complets.json', JSON.stringify(results, null, 2), 'utf8');
        console.log(`Results saved to resultats_analyses_complets.json (${results.length} samples)`);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

scrapeAllPagesAndDetails();