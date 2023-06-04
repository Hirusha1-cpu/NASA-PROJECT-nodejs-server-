const request = require('supertest');
const app = require('../../app');
const {
    mongoConnect,
    mongoDisconnect,


} = require('../../services/mongo')

describe('Launches API', ()=>{

    beforeAll(async()=>{
      await  mongoConnect()
    
    })

    afterAll(async()=>{
        await mongoDisconnect()
    })

    describe('Test GET /launches', ()=>{
        test('It Sholud respond with 200 sucessfully',async ()=>{
            const response = await request(app).get('/launches').expect(200).expect('Content-Type', /json/);
            
        });
    });
    
    describe('Test POST /launches', ()=>{
        const completeLaunchData = {
    
                mission: 'USS Enterprise',
                rocket:'NCC 1701-D',
                target: "Kepler-186 f",
                launchDate:"January 4,2028",
       
        };
    
        const launchDataWithoutDate = {
    
                mission: 'USS Enterprise',
                rocket:'NCC 1701-D',
                target: "Kepler-186 f",
          
    
        }
        const launchDataWithInvalidDate = {
            mission: 'USS Enterprise',
            rocket:'NCC 1701-D',
            target: "Kepler-186 f",
            launchDate:"pakay",
        }
    
        test('It Sholud respond with 201 sucessfully',async ()=>{
            const response = await request(app).post('/launches')
            .send(completeLaunchData).expect('Content-Type', /json/).expect(201);
    
            const requestDate =new Date(completeLaunchData.launchDate).valueOf();
            const responseDate =new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
    
            expect(response.body).toMatchObject(launchDataWithoutDate)
        
        });
        test('It Sholud misssing required property',async ()=>{
            const response = await request(app).post('/launches')
            .send(launchDataWithoutDate).expect('Content-Type', /json/).expect(400);
    
            expect(response.body).toStrictEqual({
                error: "Missing required launch property"
            })
        });
    
        test ('It Sholud also catch invalid date', async()=>{
            const response = await request(app).post('/launches')
            .send(launchDataWithInvalidDate).expect('Content-Type', /json/).expect(400);
    
            expect(response.body).toStrictEqual({
                error: "Invalide launch date"
            })
    
        })
    })
})
