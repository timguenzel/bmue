function submit(bm) {
    var data = [bm]; 
    for (var i = 1; i<20; i++) {
        try {
            data.push(document.getElementById(bm + '_' + i).value);          // Daten aus den Dropdowns bzw.
            data.push(document.getElementById(bm + '_' + i + '_i').value);   // den Textboxen in das data-Array hinzugefügt
        }
        catch (e) {
            break;
        }
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    fetch('/submit', options)
}

async function nachpruefen(bm) {
    
    data = [bm];
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    const response = await fetch('/nachpruefen', options);
    const resData = await response.json()
    var resDataArray = [];
    for (item in resData) {
        resDataArray.push(resData[item]);
    }
    var currentDate = parseInt(resDataArray[0]);
    resDataArray.shift();
    var x = 0;
    for (var i = 1; i<=resDataArray.length/2; i++){
        document.getElementById(bm + '_fz_' + i).className = "formzeile";
        document.getElementById(bm + '_' + i).value = resDataArray[x];
        x++;
        document.getElementById(bm + '_' + i + '_i').value = resDataArray[x];
        x++;
    }
}

function createHtml(pcc, vorschau) {
    try {
        document.getElementById("FormblattPDF").hidden = true;
    } catch (e) {}
    
    
    rows = parseInt(document.getElementById("input1").value);
    if (!Number.isInteger(rows)) {
        return;
    }
    bm = document.getElementById("input2").value.toLowerCase();
    if (bm.length != 8) {
        return;
    }     

    //Formblatt-Gerüst
    formblatt = document.createElement("div");
    formblatt.className = "formblatt";
    formblatt.id = "FormblattPDF";
    nachpruefen = document.createElement("a");
    nachpruefen.setAttribute("onclick",`nachpruefen('${bm}')`);
    nachpruefen.className= "submit";
    nachpruefen.innerHTML = "Nachprüfung";
    formblatt.appendChild(nachpruefen)
    intervalle = []

    for (var i=1; i<=rows; i++) {
        
        //Formzeile-Gerüst
        var formzeile = document.createElement("div");
        formzeile.className = "formzeile";
        formzeile.id = bm + "_fz_" + i;

        //Formfeld1-Gerüst
        var formfeld1 = document.createElement("div")
        formfeld1.className = "formfeld1";
        //Label zu Formfeld1 hinzufügen
        label_text = ""
        stname = document.getElementById("stname_" + i).value;
        sensor = document.getElementById("sensor_" + i).value;
        fehlerart = document.getElementById("fehlerart_" + i).value;
        pruefbes = document.getElementById("pruefbes_" + i).value;
        label_text = "<u>" + stname + " || " + sensor + "</u><br><u>Fehlerart:</u> " + fehlerart + "<br><u>Prüfbeschr.:</u> " + pruefbes;
        var label = document.createElement("label")
        label.htmlFor = bm + '_' + i;
        label.id = "stationstext"
        label.innerHTML = label_text;
        formfeld1.appendChild(label);
        cur_int = document.getElementById("intervall_" + i).value;
        if (cur_int == "") {
            cur_int = 1;
        }
        cur_int = parseInt(cur_int);
        intervalle.push(cur_int);

        //Formfeld2-Gerüst
        var formfeld2 = document.createElement("div");
        formfeld2.className="formfeld2";
        //Dropdown zu Formfeld2 hinzufügen
        var dropdown = document.createElement("select")
        dropdown.id = bm + '_' + i;
        options = ["k.P.", "n.i.O.", "i.O."]
        for (var x=0; x<3; x++) {
            var option = document.createElement("option")
            option.value = options[x]
            option.innerHTML = options[x]
            dropdown.appendChild(option)
        }
        formfeld2.appendChild(dropdown);

        //Formfeld3-Gerüst
        var formfeld3 = document.createElement("div")
        formfeld3.className = "formfeld3";
        var input = document.createElement("input");
        input.type="text";
        input.id = bm + '_' + i + '_i';
        input.size = 15;
        formfeld3.appendChild(input);

        //Formfelder zu Formzeile hinzufügen
        formzeile.appendChild(formfeld1);
        formzeile.appendChild(formfeld2);
        formzeile.appendChild(formfeld3);
        //Formzeile zu Formblatt hinzufügen
        formblatt.appendChild(formzeile); 
    }
    pdfbtn = document.createElement("a");
    pdfbtn.setAttribute("onclick",`pdf('${bm}')`);
    pdfbtn.className = "submit";
    pdfbtn.innerHTML = "Abschicken";
    formblatt.appendChild(pdfbtn);
    if (vorschau) {
        var currentDiv = document.getElementById("FormblattPDF");
        document.body.insertBefore(formblatt, currentDiv);

    } else {
        data = [bm, rows, intervalle]
        options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }
        fetch('/createdatabase', options)
        strformblatt = formblatt.innerHTML;
        $(document).ready(function()
        {
            $.get("/forms/testvorlage.html", function(html_string)
            {
                old_html = html_string.split("<!--TITEL-->")
                html_string = old_html[0] + `${bm} BMÜ` + old_html[1]
                old_html = html_string.split("<!--HEADER-->")
                html_string = old_html[0] + `${bm.toUpperCase()} | ${document.getElementById("input3").value.toUpperCase()}` +old_html[1]
                old_html = html_string.split("//SPLITTER")
                html_string = old_html[0] + `bm = "${bm}"` + old_html[1]
                htmlvorlage = html_string.split("<!--SPLITTER-->"); 
                newhtml = htmlvorlage[0] + strformblatt + htmlvorlage[1];
                data = [pcc, bm, newhtml]
                options = {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }
                fetch('/savebm', options)
            },'html');
        });
        $(document).ready(function()
        {
            $.get(`/forms/pcc_${pcc}/vs_${pcc}.html`, function(html_string)
            {
                old_html = html_string.split("<!--SPLITTER-->")
                html_string = old_html[0] + `<a id='${bm}' onclick='bm_click(this.id)' class='button'>${bm.toUpperCase()}</a> <!--SPLITTER-->` + old_html[1]
                data = [pcc, bm, html_string]
                options = {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }
                fetch('/newbtn', options)
                location.reload();
                alert(bm + " wurde erfolgreich erstellt!")
            },'html');
        });
    }
}

async function weiter(pcc) {
    rows = parseInt(document.getElementById("input1").value);
    if (!Number.isInteger(rows)) {
        document.getElementById("input1").style = "background-color: rgb(255, 125, 100);";
        if (document.getElementById("input2").value.toLowerCase().length == 8) {
            document.getElementById("input2").style = "";
        }
        return;
    }
    bm = document.getElementById("input2").value.toLowerCase();
    if (bm.length != 8) {
        document.getElementById("input2").style = "background-color: rgb(255, 125, 100);";
        if (Number.isInteger(rows)) {
            document.getElementById("input1").style = "";
        }
        return;
    }
    document.getElementById("input1").style = "";
    document.getElementById("input2").style = "";
    data = [bm]
    options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    response = await fetch("/checkbm",options)
    checkbm = await response.json()
    if (checkbm) {
        return
    }
    document.getElementById("input1").disabled = true;
    document.getElementById("input2").disabled = true;
    document.getElementById("input3").disabled = true;

    formblatt = document.getElementById('newbm_fb')

    for (var i=1; i<=rows; i++){
        station = document.createElement('div');
        station.className = "formzeile";
        label_stname = document.createElement('label');
        label_stname.htmlFor = 'stname_' + i;
        label_stname.className="newbmtext"
        label_stname.innerHTML = "Stationsname:"
        stname = document.createElement('input');
        stname.type='text';
        stname.className="newbmtext";
        stname.id = "stname_" + i;
        stname.size = 7;
        label_sensor = document.createElement('label');
        label_sensor.htmlFor = 'sensor_' + i;
        label_sensor.className="newbmtext";
        label_sensor.innerHTML = "Sensoradresse:"
        sensor = document.createElement('input');
        sensor.type='text';
        sensor.className="newbmtext";
        sensor.id = "sensor_" + i;
        sensor.size = 7;
        label_fehlerart = document.createElement('label');
        label_fehlerart.htmlFor = 'fehlerart_' + i;
        label_fehlerart.innerHTML = "Fehlerart:";
        label_fehlerart.className="newbmtext"
        fehlerart = document.createElement('input');
        fehlerart.type='text';
        fehlerart.className="newbmtext";
        fehlerart.id = "fehlerart_" + i;
        fehlerart.size = 15;     
        label_pruefbes = document.createElement('label');
        label_pruefbes.htmlFor = 'pruefbes_' + i;
        label_pruefbes.className="newbmtext"
        label_pruefbes.innerHTML = "Prüfbes.:";
        pruefbes = document.createElement('input');
        pruefbes.type='text';
        pruefbes.className="newbmtext";
        pruefbes.id = "pruefbes_" + i;
        pruefbes.size = 15;
        label_intervall = document.createElement('label');
        label_intervall.htmlFor = 'intervall_' + i;
        label_intervall.className="newbmtext"
        label_intervall.innerHTML = "Intervall:";
        intervall = document.createElement('input');
        intervall.type='text';
        intervall.className="newbmtext";
        intervall.id = "intervall_" + i;
        intervall.size = 4;
        
        nummer = document.createElement("p")
        nummer.style = "margin-top: 5px;"
        nummer.innerHTML = i + '.';
        station.appendChild(nummer)
        station.appendChild(label_stname)
        station.appendChild(stname)
     
        station.appendChild(label_sensor)
        station.appendChild(sensor)
     
        station.appendChild(label_fehlerart)
        station.appendChild(fehlerart)
       
        station.appendChild(label_pruefbes)
        station.appendChild(pruefbes)

        station.appendChild(label_intervall)
        station.appendChild(intervall)
       
        formblatt.appendChild(station)
    }
    vorschau = document.createElement("a");
    vorschau.setAttribute("onclick", `createHtml('${pcc}',true)`)
    vorschau.className = "button";
    vorschau.innerHTML = "Vorschau";
    formblatt.appendChild(vorschau)
    cHtml = document.createElement("a");
    cHtml.setAttribute("onclick", `createHtml('${pcc}',false)`)
    cHtml.className = "button";
    cHtml.style = "float: right;";
    cHtml.innerHTML = "BM erstellen";
    formblatt.appendChild(cHtml)
    var currentDiv = document.getElementById("newbm_fb");
    document.body.insertBefore(formblatt, currentDiv);
}

function deletebm(vs) {
    bm = document.getElementById("del_select").value;
    text = `Wollen Sie wirklich das Formblatt und den Button für das Betriebsmittel ${bm} löschen?`
    var check = window.confirm(text)
    if (!check) {
        return;
    }
    $(document).ready(function()
    {
        $.get(`/forms/pcc_${vs}/vs_${vs}.html`, function (html_string) {
            console.log(`<a id="${bm}" onclick="bm_click(this.id)" class="button">${bm.toUpperCase()}</a>`)
            html_string = html_string.split(`<a id='${bm}' onclick='bm_click(this.id)' class='button'>${bm.toUpperCase()}</a>`)
            new_html = html_string[0] + html_string[1]
            data = [vs, bm, new_html]
            options = {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
            fetch("/deletebm", options)
            location.reload();
        }, 'html');
    });
}