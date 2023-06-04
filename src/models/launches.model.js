const launchesDB = require('./launches.mongo')

const planets = require('./planets.mongo')

const  DEFAULT_FLIGHT_NUMBER = 100;
//const launches = new Map();

const launch = {
    flightNumber: 100,
    mission: "Kepler Exploration x",
    rocket: "Explorer IS1",
    launchDate: new Date('December 27, 2030'),
    target: "Kepler-442 b",
    customers: ['ZTM', 'NASA'],
    upcoming: true,
    success: true,
}
saveLaunch(launch);

//launches.set(launch.flightNumber, launch)

async function existsLaunchWithId(launchId) {
    return await launchesDB.findOne({
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

async function getAllLaunches() {
    return await launchesDB.find({},{'_id':0, '__v':0});
}

async function saveLaunch(launch){
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if(!planet){
        throw new Error("No planet found with that name")
    
    }

    await launchesDB.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    },launch, {
        upsert: true,
    })
}

async function scheduledNewLaunch(launch){
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
    getAllLaunches,
    existsLaunchWithId,
    
    scheduledNewLaunch,
    abortLaunchById,
    
}