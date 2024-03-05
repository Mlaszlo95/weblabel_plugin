// ==UserScript==
// @name         Show only created by me
// @namespace    http://tampermonkey.net/
// @version      1.00
// @description  Az a feladata hogy beilleszen egy gombot és csak azokat a címkéket jelenítsen meg amit a felhasználó hoz létre.
// @author       DPD IT
// @match        https://weblabel.dpd.hu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dpd.hu
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// ==/UserScript==
// @run-at        document-start
// ==/UserScript==



(function() {
    'use strict';

    var currentUrl = window.location.href;
    console.log(currentUrl)

    if(currentUrl!= null && currentUrl.indexOf("https://weblabel.dpd.hu/index.php?menuid=0&modul=parcel&action=list") !== -1){
        console.log("Weblabel package list")

        //ha a gomb már le volt nyomva akkor tárolja a bekapcsolásának az értékét
        if(GM_getValue("Addon_turn_on") === undefined){
             GM_setValue("Addon_turn_on",false)
        }else{
             if(GM_getValue("Addon_turn_on")){
                 let rowsDatas = getTableData()
                 EnableSetting(rowsDatas);
             }
        }

        var button = createButton("Saját címkék mutatása");
        button.addEventListener("click", buttonPersonalViewFunction);

        const newDiv = createDiv();
        insertAfter(newDiv,document.querySelectorAll('input[name = "subaction"]')[0])


        document.getElementById("customField").appendChild(button);
        //teszt
        deleteOlderGMvalue(3)
        //teszt
    }

    if(currentUrl == "https://weblabel.dpd.hu/index.php?menuid=0&modul=parcel&action=new"){
       console.log("Weblabel package recording")


       var saveButton = document.getElementById("saving");
       var saveWithAddress= document.getElementById("saving_with_address");
       var printButton = document.getElementById("printing");


       saveButton.addEventListener("click", buttonSaveFunction,true);
       saveWithAddress.addEventListener("click", buttonSaveFunction,true);
       printButton.addEventListener("click", buttonSaveFunction,true);

       const date = new Date();


       var name = document.getElementById("customer_name").Value

       GM_setValue('WeblabelPackageRecording',true)
    }
    //van egy weblabel script ami hibára futt, ezzel az a baj hogy újra tölti az oldalt.
    //mivel újra tölti az oldalt ezért a scriptemet ami felül van kinulláza.
    //

})();

//kitörlni azokata mentet értékeket amik öregebbek 3 napnál
function deleteOlderGMvalue(day){
    var lists = GM_listValues();
    var current = new Date(getCurrentDate())

    lists.forEach((element) => {
       var thisDate = new Date(element)

       const diffDays = parseInt(current - thisDate) / (1000*60*60*24)
       if(diffDays > day){
          GM_deleteValue(element)
       }else{
          return;
       }
    })
    //
}

function deleteAllGmValue(){
   var lists = GM_listValues();
   lists.forEach((element) => {
       GM_deleteValue(element)
    })
}

function buttonPersonalViewFunction(){
    let rowsDatas = getTableData()

    console.log(rowsDatas)

    console.log(rowsDatas)
    if(GM_getValue("Addon_turn_on") === undefined){
        GM_setValue("Addon_turn_on",true)
        EnableSetting(rowsDatas)
    }else{
       if(!GM_getValue("Addon_turn_on")){
           GM_setValue("Addon_turn_on",true)
           EnableSetting(rowsDatas)
       }else{
           console.log("kikapcsolva")
           disableSetting(rowsDatas)
           GM_setValue("Addon_turn_on",false)
       }
    }




    console.log("Personal View")
}

function checkWhitespace(str) {
    return /^[\s\n]+$/.test(str);
}

function removeWhitespace(query) {
    return query.replace(/^[\s\n]+|[\s\n]+$/g, '');
}


function EnableSetting(rowsDatas){
   for (const [key, value] of Object.entries(rowsDatas)) {
       var field = document.getElementById(key)
       var checkbox = document.getElementById(key.replace('TableRow',''))
       if(!rowsDatas[key].createdbyme){
           checkbox.disabled = true
           field.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
           field.className = "rowgrey"
       }

   }
}

function disableSetting(rowsDatas){
   for (const [key, value] of Object.entries(rowsDatas)) {
       var field = document.getElementById(key)
       var checkbox = document.getElementById(key.replace('TableRow',''))
       if(rowsDatas[key].disabledrow){
           field.style.backgroundColor = "";
       }else{
           field.style.backgroundColor = "";
           checkbox.disabled = false
       }
   }
}

function checkTheElements(input){
    var getStoredList = GM_listValues();

    

    var itemCreatedByYou = false
    var ZeroStoredElement = {
        cause: "data store is empty"
    };

    getStoredList.forEach(Element => {
        if(Element.length == 1 || Element.length == 0){
             throw ZeroStoredElement;
        }else{
             for (const [key, value] of Object.entries(GM_getValue(Element))){
                    console.log(key + ":" + value)
                    console.log(key + ":" + input[key])
                    if(input[key].includes(value)){
                        console.log(key + ":" + value)
                        console.log(key + ":" + input[key])
                        itemCreatedByYou = true
                    }else{
                        itemCreatedByYou = false
                        break
                    }
               }
        }
    })
    var text = "createdbyme"
    input[text] = itemCreatedByYou
    return input
}

function getTableData(){
    var endHtml ='<img title="Nem lehet törölni a csomagot." src="images/button_del_cant.gif">'
    var endhtmlSecOption = '<a title="Csomag törlése." onclick="return question'
    var referencOption = '<span style="display:block;width:97px;text-align:center;word-wrap:break-word;">'


    //kiveszi a táblázat fő részét
    var main = document.querySelector('div.window_cont')
    //kiveszi a táblázatból az adatokat
    var fields = main.querySelectorAll('span')
    //felfüzzük az elemeket
    var collumNumber = 0;
    var rowNumber = 0;
    var setRef = false

    //kiveszük a gép tárjából azokat a csomagokat amiket rögzítettünk
    var lists = [];
    let thisElement = {}
    var header

    var disabledRow = false

    //kiszedjük a weblabelben szereplő adatokat egy objecktumban, azért van rá szükség hogy később azonosítható legyen
    fields.forEach(element =>{
        var output = element.lastChild.textContent
        var outputHTML = element.innerHTML
        var referenc;
        var one = true;

        var id = "TableRow"+rowNumber
        var className = element.closest('span').getAttribute("class")

        if(className!=null && className.indexOf('row') !==-1){
            header = element
            if(header.className == "rowgrey"){
                 disabledRow = true
            }
        }
        var index = '';

        //ha szereppel benne akkor az a sor vége, ezt találtam a legegyszerűbbnek az azonosítására, nem feltétlenül jó
        if((outputHTML.indexOf(endHtml) !==-1 || outputHTML.indexOf(endhtmlSecOption) !==-1 ) && Object.keys(thisElement).length){
           one = true
           var endId = "End"+rowNumber
           header.setAttribute('id',id)

           //van olyan eset amit szeretnék hozzáfűzni egy olyan gombot amivel hozzá lehet adni az én általam felvett listához.
           //ezért jól jön ha endjelek a rowok végén azonosíthatóak
           element.setAttribute('id',endId)
           try{
              thisElement = checkTheElements(thisElement)
           }catch(e){
              if(e.cause==="data store is empty"){
                  var Expindex = "createdbyme"
                  thisElement[Expindex] = false
              }
           }
           var indexDisable = "disabledrow"
           thisElement[indexDisable] = disabledRow

           disabledRow = false

           rowNumber++;
           collumNumber = 0

           lists[id] = thisElement
           thisElement = {}
        }else{

            if(!checkWhitespace(output) && collumNumber!=1 && !setRef){
                switch(collumNumber){
                    case 0: index = 'date';break;
                    case 1: index = '';break;
                    case 2: index = 'name';break;
                    case 3: index = 'zip';break;
                    case 4: index = 'address';break;
                    case 5: index = '';break;
                    case 6: index = 'weight';break;
                    case 7: index = '';break;
                    case 8: index = '';break;
                }
                if(index !== ''){
                    thisElement[index] = removeWhitespace(output)

                }
                collumNumber++
                //console.log(thisElement[number])
           }
            if(setRef){
                setRef = false
            }

            if(collumNumber==1 && element.querySelector('a') !==null){
             var parcelnumberField = element.querySelector('a')
             let parcelnumber = parcelnumberField.innerHTML
             index = 'parcelnumber'
             thisElement[index] = parcelnumber
             one = false
             collumNumber = collumNumber+1
             index = 'referent'
             thisElement[index] = removeWhitespace(element.textContent).replace(parcelnumber,"") || ""

             setRef = true
           }

        }
    })

    return lists
}

function referencNumberToEnd(input){
    var refindex = "referenc"

    for (const [key, value] of Object.entries(input)) {
        if(key==1){
           input[refindex] = value
        }
        if(key>1){
           var change = value
           input[key - 1] = value
           delete input[key]
        }
    }
    return input
}

function buttonSaveFunction(){
    console.log("Save button clicked!")


    var InputName = document.getElementById("customer_name").value
    var InputReferent = document.getElementById("parcel_reference_0").value
    var InputZip = document.getElementById("customer_zipcode").value
    var InputCity = document.getElementById("customer_city").value
    var InputStreet = document.getElementsByName("customer_street")[0].value
    var InputWeight = document.getElementById("parcel_0").value
    var InputEmail = document.getElementsByName("customer_email")[0].value

    // ha ezek az értékek üresek vagy nem felel meg a kritériumnak akkor nem történik mentés
    //név valamiért 4 karakter minimum amikor a weblabel 3-mat ír. Kisebb bug weblabel oldalán. Kódban ezért 4 minimum feltétel hogy szikronban maradjon a weblabelel
    if((InputName!==undefined && InputName.length >= 4) && InputZip!==undefined &&
       (InputCity!==undefined && InputCity.length >= 3) && InputStreet!==undefined &&
       (InputEmail!==undefined && checkIsItEmail(InputEmail) && InputZip.length >= 3 )
      ){
        GM_setValue(getCurrentDate(),{
            "name": InputName,
            "referent" : InputReferent,
            "zip": InputZip,
            "address":InputStreet +', '+ InputCity,
            "weight":InputWeight
        });
        console.log("Data Saved!");
    }else{
        console.log("Not Saved!");
    }
}

function checkIsItEmail(email){

    if(email.include("@") && email.include(".")){
        var address = email.split("@")[0];
        var maindomain = email.split("@")[1]

        var domain = maindomain.split(".")[0];
        var topleveldomain = maindomain.split(".")[1]

        if(address.length >= 1 && domain.length >=2 && topleveldomain.length >=2 ){
            return true
        }
    }


    return false
}

function getCurrentDate(){
   var currentDate = new Date();

   var year = currentDate.getFullYear();
   var month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // A hónap számozása 0-tól indul, ezért +1 kell
   var day = ('0' + currentDate.getDate()).slice(-2);

   var hours = ('0' + currentDate.getHours()).slice(-2);
   var minutes = ('0' + currentDate.getMinutes()).slice(-2);
   var seconds = ('0' + currentDate.getSeconds()).slice(-2);
   var milliseconds = ('00' + currentDate.getMilliseconds()).slice(-3);


   var formattedDate = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
   return formattedDate
}

function createDiv(){
          const newDiv = document.createElement("div")
          newDiv.setAttribute('id','customField');
          newDiv.style.marginTop = "10px";
          newDiv.style.width = "790px";
          newDiv.style.height = "20px";

    return newDiv;
}

function createButton(text){
   var newButton = document.createElement("button")
   newButton.setAttribute('type', 'button');
   newButton.setAttribute('id', 'WeblabelUserOnly');
   newButton.innerHTML = text;

    return newButton;
}

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}
