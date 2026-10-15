const mongoose = require("mongoose")

const MAX_ATTEMPTS = 10
const RETRY_DELAY_MS = 5000

require("dotenv").config()

async function ConnectDB(){
    for(let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++){
        try{
            await mongoose.connect(process.env.MONGODB)
            return true
        }catch(error){
            console.log("Error in DATABASE (attempt " + attempt + "/" + MAX_ATTEMPTS + "):", error.message)
            if(attempt < MAX_ATTEMPTS){
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
            }
        }
    }
    console.log("DATABASE connection failed after " + MAX_ATTEMPTS + " attempts")
    // Let callers decide: starting to serve traffic (or consume queue jobs)
    // without a database only produces failures.
    return false
}

module.exports = ConnectDB;