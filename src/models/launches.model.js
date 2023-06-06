const axios = require('axios');

const launchesDB = require('./launches.mongo')

const planets = require('./planets.mongo')

const  DEFAULT_FLIGHT_NUMBER = 100;
//const launches = new Map();

// const launch = {
//     flightNumber: 100,//flight_number
//     mission: "Kepler Exploration x",//name
//     rocket: "Explorer IS1",//rocket.name
//     launchDate: new Date('December 27, 2030'),//data_local
//     target: "Kepler-442 b",//not applicable
//     customers: ['ZTM', 'NASA'],//payload.customers for each payload
//     upcoming: true,//upcoming
//     success: true,//success
// }
//saveLaunch(launch);

const SPACEX_API_URL ='https://api.spacexdata.com/v4/launches/query'

async function populateLaunches(){
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL,{
        query:{},
        options:{
            pagination:false,
            populate:[
                {
                    path:"rocket",
                    select:{
                        name:1
                    }
                },
                {
                    path:'payloads',
                    select:{
                        'customers':1
                    }
                }
            ]
        }
    });

    if(response.status !== 200){
        console.log('Problem downloading launch data');
        throw new Error('Problem with request');
    }

    const launchDocs = response.data.docs;
    for(const launchDoc of launchDocs){
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload)=>{
            return payload['customers'];
        })
        const launch = {
            flightNumber:launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        };

        console.log(`${launch.flightNumber} ${launch.mission} ${launch.rocket}`);

        await saveLaunch(launch);
    }
}

async function loadLaunchData(){
   const firstLaunch =  await findLaunch({
        flightNumber:1,
        rocket:'Falcon 1',
        mission:'FalconSat'
    });
    if(firstLaunch){
        console.log('Launch data loaded successfully');
       
    }else{
        await populateLaunches();
    }
 
}

//launches.set(launch.flightNumber, launch)
async function findLaunch(filter){
    return await launchesDB.findOne(filter);
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,

    });
}

async function getLatestFlightNumber(){
    const latestLaunch = await launchesDB
    .findOne().sort('-flightNumber'); // - means decending order to get the higherst fkight number
    if(!latestLaunch){
        return DEFAULT_FLIGHT_NUMBER
    }
    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    return await launchesDB.find({},{'_id':0, '__v':0})
    .sort({flightNumber: 1}) //-1 for decending values and 1 for ascending values
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch){
   
    await launchesDB.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    },launch, {
        upsert: true,
    })
}

async function scheduledNewLaunch(launch){
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if(!planet){
        throw new Error("No planet found with that name")
    
    }

    const newFlightNumber = await getLatestFlightNumber() +1;
    const newLaunch = Object.assign(launch,{
        success:true,
        upcoming:true,
        customers: ['Zero to Mastery', 'NASA'],
        flightNumber: newFlightNumber
    });
    await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
//     latestFlightNumber++;
//     launches.set(launch.flightNumber,
//         Object.assign(launch, {
//             flightNumber: latestFlightNumber,
//             customers: ['Zero to Mastery', 'NASA'],
//             upcoming: true,
//             success: true,

//         }));
// }

async function abortLaunchById(launchId) {
    const aborted =  await launchesDB.updateOne({
        flightNumber: launchId,

    },{
        upcoming:false,
        success:false
    });

    return aborted.ok == 1 && aborted.nModified ===1 ;
    // const aborted = launches.get(launchId);
    // aborted.upcoming = false;
    // aborted.success = false;
    // return aborted
}

module.exports = {
    
    loadLaunchData,
    getAllLaunches,
    existsLaunchWithId,
    scheduledNewLaunch,
    abortLaunchById,
    
    
}