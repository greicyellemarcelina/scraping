const axios = require("axios");
const cheerio = require('cheerio');
const fs = require("fs");
const ora = require("ora");
const inquirer = require("inquirer");
const json2xls = require('json2xls');

async function start() {
    const busca = "iphone"; 
    const { caminho } = await inquirer.prompt([
        { type: "input", name: "caminho", message: "Onde deseja salvar o seu xlsx?", default: "./teste.xlsx" }
    ]);
    
    const html = await buscarHTML(busca);
    const dados = await extrairDados(html);

  await salvarXlsx(dados, caminho);
}

async function buscarHTML(busca) {
    const loading = ora("Buscando resultados na Amazon").start();

    try {
        const result = await axios.get(`https://www.amazon.com.br/s?k=${busca}&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&ref=nb_sb_noss`);
        loading.succeed();
        return result.data;
    } catch (err) {
        loading.fail();
    }

}

async function extrairDados(html) {
    const $ = cheerio.load(html);

    var resultNodes = $(".s-result-item").toArray();

    var products = resultNodes.map(node => {

        const descriptionNode = $("h2", node);
        const priceNode = $(".a-price .a-offscreen", node);

        const description = descriptionNode.first().text().trim();

        let price = 0;
        if (priceNode.length) {
            price = priceNode.first().text().trim();
            price = price.replace(/[^0-9,]/gi, "");
            price = price.replace(",", ".");
            price = Number(price);
        }

        return {
            description,
            price
        }
    })
    return products;
}

function salvarXlsx(data, path) {
    const loading = ora("Salvando xlsx").start();

    return new Promise((resolve, reject) => {

        try {
            let xlsx = json2xls(data);    

            fs.writeFile(path, xlsx, `binary` ,err=> {
                if (err) {
                    loading.fail();
                    return reject(err);
                }
                resolve();
                loading.succeed();

            })

        } catch (err) {
            reject(err)
            loading.fail();

        }

    })

}

start();


