const express = require("express")
const bodyParser = require("body-parser")
const request = require('request')
const mysql = require('mysql')
const puppeteer = require("puppeteer")
const fs = require('fs')

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "spotify_socialite"
})

const app = express()
app.use(bodyParser.json())

const port = process.env.PORT || 5006
app.listen(port, () => console.log("Server started on port " + port))

const startScraping = async (browser, music) => {
    const musicPage = await browser.newPage()
    try {        
        const url = music.file
        await musicPage.goto(url, { waitUntil: "networkidle0", timeout: 0 })
        await musicPage.waitFor(1000);    
        const artwork = await musicPage.evaluate(() => {        
            document.querySelectorAll('div.link-option-row-action')[0].click()
            return document.querySelectorAll(`img.link-cover-image`)[0].src
        })
    
        let arr = artwork.split('/')
        let filename = arr[arr.length - 1]
    
        download(artwork, filename + '.jpeg', function() {
            // console.log(`UPDATE music_libraries SET artwork = "${filename + '.jpeg'}", mp3 = "${music.artist + ' - ' + music.track_name + ' (Magic Records Release).mp3'}" WHERE id=${music.id}`)
            con.query(`UPDATE music_libraries SET artwork = "${filename + '.jpeg'}", mp3 = "${music.artist + ' - ' + music.track_name + ' (Magic Records Release).mp3'}" WHERE id=${music.id}`, function (err, result, fields) {
                if (err) throw err
            })
        })
    } catch(e) { }

    // if(await musicPage.$(`img.link-cover-image`) !== null) {
    //     await musicPage.waitForSelector(`img.link-cover-image`)
    //     await musicPage.waitForSelector(`div.link-option-row-action`)
    //     let artwork = await musicPage.evaluate(() => {
    //         // const elem = document.querySelectorAll('div.link-option-row-action')[0]            
    //         // elem.click()
    //         console.log(document.querySelectorAll(`img.link-cover-image`)[0].src)
    //         return document.querySelectorAll(`img.link-cover-image`)[0].src
    //     })
    //     let arr = artwork.split('/')
    //     let filename = arr[arr.length - 1]
    //     download(artwork, filename + '.jpeg', function() {
    //         console.log('done')
    //     })
    //     musicPage.close()        
    // } else {			
    //     musicPage.close()
    // }

    console.log('sssss')
}

const run = async (musics) => {
    const browser = await puppeteer.launch({ headless: false })
    for(let i = 0; i < 10; i++) {
        await startScraping(browser, musics[i])
    }
}

con.connect(function(err) {
    if (err) throw err    
    console.log('db connected')
    con.query(`SELECT * FROM music_libraries`, function (err, result, fields) {
        if (err) throw err
        run(result)
    })
})

const download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
    //   console.log('content-type:', res.headers['content-type']);
    //   console.log('content-length:', res.headers['content-length']);
  
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  };