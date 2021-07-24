const puppeteer=require('puppeteer');
let url="https://www.mygov.in/covid-19"
let page;
let fs=require('fs');
async function fn(){
    try{
        //opening browser
        let browser=await puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:[
                "--start-maximized"
            ]
            
        });
        let pagesArr=await browser.pages();
        page=pagesArr[0];
        await page.goto(url);
        //Total Vaccination Details and tests
        let {vaccinationStatus,VaccinationCount,testStatus,testCases}=await page.evaluate(function(){
            let vaccinationStatus=document.querySelector(".total-vcount span").innerText.trim();
            let VaccinationCount=document.querySelector(".total-vcount strong").innerText.trim();
            let testStatus=document.querySelector(".testing_result span").innerText.trim();
            let testCases=document.querySelector(".testing_result .testing_count ").innerText.trim();
            return {vaccinationStatus,VaccinationCount,testStatus,testCases};

        })
        console.log(vaccinationStatus,VaccinationCount);
        console.log(testStatus,testCases);
        await page.waitForSelector(".marquee_data.view-content .views-row .st_name");
        await page.waitForSelector(".views-row .st_all_counts .tick-discharged small")
        //calling the function 
        let infoArr=await page.evaluate(getInfo);
        const jsonContent = JSON.stringify(infoArr);
        //writing data.json
        fs.writeFile("data.json", jsonContent, 'utf8', function (err) {
        if (err) {
        return console.log(err);
        }

        console.log("The Data file was saved!");
}); 
        await page.waitForSelector('[id="_vaccinetable"] tbody tr')
        await page.click('[id="statewise-vaccine-data"]');
        let StateWiseArr=await page.evaluate(getVaccinationDetails)
        const jsonContent1 = JSON.stringify(StateWiseArr);
        //writing vaccination.json
        fs.writeFile("Vaccination.json", jsonContent1, 'utf8', function (err) {
            if (err) {
            return console.log(err);
            }
    
            console.log("The Vaccination file was saved!");
    }); 
    await page.click(".ac_title1.statewise_title");
    await page.waitForSelector('[id="_indiatable"] tbody tr')
        let StateWiseCasesArr=await page.evaluate(getCaseDetails)
        const jsonContent2 = JSON.stringify(StateWiseCasesArr);
        //writing cases.json
        fs.writeFile("Cases.json", jsonContent2, 'utf8', function (err) {
            if (err) {
            return console.log(err);
            }
    
            console.log("The Cases file was saved!");
    }); 
        await browser.close()

    }catch(err){
        console.log(err);
    }
}
//getting the data
function getInfo(){
    //name of states cases and vaccination details are stored in an object and passed to the array
    let Stateinfo=document.querySelectorAll(".marquee_data.view-content .views-row .st_name");
    let CasesInfo=document.querySelectorAll(".marquee_data.view-content .views-row .st_number")
    let casesStats=document.querySelectorAll(".views-row .st_all_counts");
    let vaccinationStats=document.querySelectorAll(".tick-total-vaccine small");
    let infoArr=[];
    for(let i=0;i<Stateinfo.length;i++){
        let State=Stateinfo[i].innerText.trim();
        let Cases=CasesInfo[i].innerText.trim();
        //first children last child inner html
        let Cases_confirmed=casesStats[i].children[0].lastChild.innerHTML;
        let Cases_active=casesStats[i].children[1].lastChild.innerHTML;
        let Cases_recovered=casesStats[i].children[2].lastChild.innerHTML;
        let Deaths=casesStats[i].children[3].lastChild.innerHTML;
        let vaccination_Count=vaccinationStats[i].innerHTML;
        infoArr.push({State,Cases,Cases_confirmed,Cases_active,Cases_recovered,Deaths,vaccination_Count})
    }
    return infoArr;
}
//To fetch the vaccination info per state
function getVaccinationDetails(){
    let StatewiseInfo=document.querySelectorAll(".ind-vacc_mp_tbl.sortable tbody tr");
    let Statewisevaccination=document.querySelectorAll(".ind-vacc_mp_tbl.sortable tbody tr .mid-wrap");
    let StateWiseArr=[];
    for(let i=0,j=0;i<Statewisevaccination.length,j<StatewiseInfo.length;i++,j++){
            let State=StatewiseInfo[j].children[0].innerText;
            let Total_Vaccination_Doses=Statewisevaccination[i].innerHTML.split("<")[0];
            let Dose_1=Statewisevaccination[++i].innerHTML.split("<")[0];
            let Dose_2=Statewisevaccination[++i].innerHTML.split("<")[0];
          let Vaccination_Doses=Statewisevaccination[++i].innerHTML.split("<")[0];
        StateWiseArr.push({State,Total_Vaccination_Doses,Dose_1,Dose_2,Vaccination_Doses});
    }
    return StateWiseArr;
}
//to fetch the cases table per state wise
function getCaseDetails(){
    //different selectors are used because it exceeds the time limit
    let StatewiseInfo=document.querySelectorAll(".ind-mp_tbl.sortable tbody tr");
    let Statewisecases=document.querySelectorAll(".ind-mp_tbl.sortable tbody tr .mid-wrap");
    let StateWiseArr=[];
    for(let i=0,j=0;i<Statewisecases.length,j<StatewiseInfo.length;i++,j++){
            let State=StatewiseInfo[j].children[0].innerText;
            let Total_Cases=Statewisecases[i].innerHTML.split("<")[0];
            let Active=Statewisecases[++i].innerHTML.split("<")[0];
            let Discharged=Statewisecases[++i].innerHTML.split("<")[0];
          let Deaths=Statewisecases[++i].innerHTML.split("<")[0];
          let Discharge_Ratio=Statewisecases[++i].innerText;
          let Death_Ratio=Statewisecases[++i].innerText;
        StateWiseArr.push({State,Total_Cases,Active,Discharged,Deaths,Discharge_Ratio,Death_Ratio});
    }
    return StateWiseArr;
}
fn();