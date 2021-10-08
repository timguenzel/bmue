const { response } = require('express');
const express = require('express');
const path = require('path');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

app.use(express.json({limit: '1mb'}));

function getColumns(row) {
    //Gibt die Anzahl der Spalten wieder, welche in der jeweiligen Tabelle vorhanden sind
    //!Es muss mindestens eine Reihe in der Tabelle ausgefüllt sein!(manuell)
    var i = 0;
    for (p in row){
        i++;
    }
    return i;
}

function getStations(table, callback) {
    var db = new sqlite3.Database('./database/bm_database.db');
    var stations = [];
    db.serialize(() => {
        db.get(`SELECT *
        FROM ${table}`, (err, row) => {
            if (err) {
                throw err;
            }
            cols = getColumns(row); 
            cols = (cols-1)/2;
            stations= []
            //Konstruiert ein array, welches alle Spaltennamen enthält
            for (var i=1; i<=cols+1; i++){
                if (i==1){
                    stations.push('letzte')
                } else {
                    stations.push(`ST${i-1}`)
                    stations.push(`ST${i-1}_messung`)
                }
            }
            callback(stations);
        });
    });   
    db.close();
}

function getDatum(next) {
    //Gibt die millisekunden, die seit dem 1.1.1970 vergangen sind wieder
    if (next == null) {
        next = 0;
    }
    var currentDate = new Date();
    var futureDate = new Date(currentDate.getTime() + next*86400000);
    return futureDate;
}

function writeToDatabase(table, data) {
    getStations(table, function(stations) {
        var db = new sqlite3.Database('./database/bm_database.db');
        db.serialize(() => {
            var placeholder = "?"
            //Der Platzhalter "placeholder" besteht aus einer Anreihung von "?,", welche später mit Daten befüllt werden
            for (var i=1; i<stations.length; i++){
                placeholder += ",?"
            }
            //Jetziges und nächstes Datum in das "data"-Array einfügen
            data.unshift(getDatum());
            
            //Daten in die jeweilige Tabelle einfügen
            db.run(`INSERT INTO ${table} VALUES (${placeholder})`, data, function(err) {
                if (err) {
                    throw err;
                }
            });
        })
        db.close();
        
    });
}

function createDatabase(bm, num, intervalle) {
    var db = new sqlite3.Database('./database/bm_database.db');
    db.serialize(() => {
        columns = []
        var placeholder = "?"
        var werte = [1]
        for (var i=1; i<=num; i++) {
            columns.push("ST" + i + "  TEXT,")
            columns.push("ST" + i + "_messung   TEXT,")
        }
        spalten = '"letzte"    TEXT,';
        for (var i=0; i<=columns.length; i++) {
            if (i == columns.length) {
                spalten += 'PRIMARY KEY("letzte")'
                break;
            }
            placeholder += ",?"
            werte.push(1);
            spalten += columns[i]
        }
        ints = [`'${bm}'`]
        marvins = "bm"
        for (var i=1; i<=intervalle.length; i++){
            marvins += ",ST" + i
            ints.push(`'${intervalle[i-1]}'`)
        }
        db.run(`CREATE TABLE IF NOT EXISTS "${bm}" (${spalten})`,function(err) {
            if (err) {
                throw err;
            }
        })
        db.run(`INSERT INTO ${bm} VALUES (${placeholder})`, werte, function(err)  {
            if (err) {
                throw err;
            }
        })
        db.run(`INSERT INTO intervalle (${marvins}) VALUES (${ints})`, function(err) {
            if (err) {
                throw err;
            }
        })
    })
    db.close();
}

app.use('/assets', express.static('./assets/'));
app.use('/scripts', express.static('./scripts/'));
app.use('/forms', express.static('./forms/'))
app.use('/node_modules', express.static('./node_modules/'));

//Hier kann man URLs abfragen und eine Antwort senden
//https://expressjs.com/de/guide/routing.html für mehr Formatierungsinformationen
app.get('/', (req,res) => {
    //Startseite
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/pcc_*', (req,res) => {
    //Html zur Passwortabfrage gesendet
    var htmlPath = './forms' + req.originalUrl + req.originalUrl + '.html';
    res.sendFile(path.join(__dirname, htmlPath));
});

//PCC 50
app.get('/HxgZyR3mU', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 50
    res.sendFile(path.join(__dirname, '/forms/pcc_50/vs_50.html'));
});

app.get('/HxgZyR3mU/bmconf', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/bmconf.html'));
})

app.get('/HxgZyR3mU/bmconf/newbm', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/newbm.html'));
})

app.get('/HxgZyR3mU/bmconf/delbm', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/delbm.html'));
})

app.get('/HxgZyR3mU/bmconf/editbm', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/editbm.html'));
})

app.get('/HxgZyR3mU/bm[0-9]{6}', (req,res) => {
    //BMÜ-Formblatt eines BMs aus dem Valuestream PCC 50
    var htmlPath = './forms/pcc_50/' + req.originalUrl.split('/')[2] + '.html';
    res.sendFile(path.join(__dirname, htmlPath));
});

app.get('/HxgZyR3mU/faelligdashboard', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/faelligdashboard.html'));
})

app.get('/HxgZyR3mU/fehlerdashboard', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/fehlerdashboard.html'));
})

app.get('/HxgZyR3mU/historie', (req,res) => { 
    res.sendFile(path.join(__dirname, '/forms/pcc_50/historie.html'));
})


app.get('/7TrZzuiMo', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 10
    res.sendFile(path.join(__dirname, '/forms/pcc_10/vs_10.html'));
});

app.get('/2b3UUaScv', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 20
    res.sendFile(path.join(__dirname, '/forms/pcc_20/vs_20.html'));
});

app.get('/lE87cH1rY', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 25
    res.sendFile(path.join(__dirname, '/forms/pcc_25/vs_25.html'));
});

app.get('/8JitnYxX2', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 30
    res.sendFile(path.join(__dirname, '/forms/pcc_30/vs_30.html'));
});

app.get('/HnpO9XxqR', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 40
    res.sendFile(path.join(__dirname, '/forms/pcc_40/vs_40.html'));
});

app.get('/asU7mHVfG', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 45
    res.sendFile(path.join(__dirname, '/forms/pcc_45/vs_45.html'));
});

app.get('/n7UzMKe4a', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 55
    res.sendFile(path.join(__dirname, '/forms/pcc_55/vs_55.html'));
});

app.get('/0p0mUZhFy', (req,res) => {
    //BM-Auswahl für den Valuestream PCC 60
    res.sendFile(path.join(__dirname, '/forms/pcc_60/vs_60.html'));
});

//Funktionen

app.post("/savebm", (req,res) => {
    valuestream = req.body[0];
    bm = req.body[1];
    html_newBM = req.body[2];
    fs.writeFileSync(`./forms/pcc_${valuestream}/${bm}.html`, html_newBM)
})

app.post("/deletebm", (req,res) => {
    valuestream = req.body[0]
    bm = req.body[1]
    new_html = req.body[2]
    var db = new sqlite3.Database('./database/bm_database.db');
    fs.writeFileSync(`./forms/pcc_${valuestream}/vs_${valuestream}.html`, new_html)
    try {
        fs.unlinkSync(`./forms/pcc_${valuestream}/${bm}.html`)
    } catch (e) {}
    db.get(`DELETE FROM intervalle WHERE bm='${bm}'`, (err) => {
        if (err) {
            throw err;
        }
    })
    db.get(`DROP TABLE ${bm}`, (err) => {
        if (err) {
            throw err;
        }
    })
    db.close(); 
})

app.post("/newbtn", (req,res) => {
    valuestream = req.body[0];
    bm = req.body[1];
    text = req.body[2];
    fs.writeFileSync(`./forms/pcc_${valuestream}/vs_${valuestream}.html`, text)
})

app.post("/createdatabase", (req,res) => {
    bm = req.body[0];
    rows = req.body[1];
    intervalle = req.body[2];
    createDatabase(bm, rows, intervalle)
})

app.post("/editintervals", (req,res) => {
    bm =req.body[0]
    intervalle = req.body[1]
    ints = [`'${bm}'`]
    marvins = "bm"
    for (var i = 1; i <= intervalle.length; i++) {
        marvins += ",ST" + i
        ints.push(`'${intervalle[i - 1]}'`)
    }
    var db = new sqlite3.Database('./database/bm_database.db');
    db.get(`DELETE FROM intervalle WHERE bm='${bm}'`, (err, row) => {
    });
    db.get(`INSERT INTO intervalle (${marvins}) VALUES (${ints})`)
    db.close();  
})

app.post("/checkbm", (req,res) => {
    bm = req.body[0]
    var db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT bm FROM intervalle WHERE bm='${bm}'`, (err, row) => {
        if (row == null) {
            res.json(false);
        } else {
            res.json(true);
        }
    })
    db.close();  
})

app.post('/submit', (req,res) => {
    //Dieser link wird nur durch den "Abschicken" Button gefetched
    var data = req.body.slice(1);
    var table = req.body[0];
    writeToDatabase(table, data);
})

app.post('/nachpruefen', (req,res) => {
    //Dieser link wird durch den Button "Nachprüfung" gefetched
    data = req.body[0];
    var db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT * FROM ${data} ORDER BY 1 DESC`, (err, row) => {
        res.json(row);
        return;
    })
    db.close();  
})

app.post('/onload', (req,res) => {
    //Dieser link wird durch den Button "Nachprüfung" gefetched
    data = req.body[0];
    var db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT * FROM intervalle WHERE bm='${data}'`, (err, row) => {
        res.json(row);
        return;
    })
    db.close();  
})

app.get('/password', (req,res) => {
    //Dieser link wird nur durch den "Überprüfen" Button gefetched
    let db = new sqlite3.Database('./database/bm_database.db');
    db.all("SELECT valuestream, password FROM passwords", function(err, data) {
        res.json(data);
        return;
    });
    db.close();
})

app.post("/getintervals", (req,res) => {
    bm = req.body[0]
    let db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT * FROM intervalle WHERE bm='${bm}'`, function(err, data) {
        res.json(data);
        return;
    });
    db.close();
})

app.post("/logs", (req,res) => {
    ereignis = req.body[0]
    bm = req.body[1]
    date = new Date()
    date = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours()+ ":" + date.getMinutes()+ ":" + date.getSeconds()
    let db = new sqlite3.Database('./database/bm_database.db');
    db.get(`INSERT INTO logs VALUES ('${date}','${ereignis}','${bm}')`, function(err, data) {
        if (err) {
            throw err;
        }
    });
    db.close();
})

app.post("/getletzte", (req,res) => {
    bm = req.body[0]
    let db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT letzte FROM ${bm} ORDER BY 1 DESC`, function(err, data) {
        res.json(data);
        return;
    });
    db.close();
})

app.post("/numofstations", (req,res) => {
    bm=req.body[0]
    let db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT * FROM ${bm} ORDER BY 1 DESC`, function(err, data) {
        res.json(data);
        return;
    });
    db.close();
})

app.post('/gethistory', (req,res) => {
    bm = req.body[0];
    var db = new sqlite3.Database('./database/bm_database.db');
    db.all(`SELECT * FROM ${bm} WHERE letzte != '1' ORDER BY 1 DESC `, (err, rows) => {
        res.json(rows);
        return;
    })
    db.close();  
})

app.post('/letztereintrag', (req,res) => {
    bm = req.body[0];
    var db = new sqlite3.Database('./database/bm_database.db');
    db.get(`SELECT * FROM ${bm} ORDER BY 1 DESC LIMIT 1 `, (err, row) => {
        res.json(row);
        return;
    })
    db.close();  
})

app.post("/updatefehler", (req,res) => {
    bm = req.body[0]
    st = "ST" + req.body[1]
    letzte = req.body[2]
    var db = new sqlite3.Database('./database/bm_database.db');
    db.get(`UPDATE ${bm} SET ${st} = 'i.O.' WHERE letzte = '${letzte}'`, (err, row) => {
    })
    db.close();
})



app.listen(3000, () => console.log('Example app listening on port 3000!'));