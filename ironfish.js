require('dotenv').config({
    path: '../.env'
})
const {
    exec,
    spawn
} = require('child_process')
const axios = require('axios')
const moment = require('moment')
const path = require('path')
const fs = require('fs')
const CronJob = require('cron').CronJob

// https://api.telegram.org/bot853693738:AAFD6AA9-qGog1lA1YCOE_QeVnW99pXITHk/sendMessage?chat_id=-1001746527066&text=hello

const log = console.log
const logErr = log
let firstTimeCheck = true

new CronJob('0 2 * * * *', async function () {
    try {
        log('This is from cron job')
        let result = await checkNodeStatus()

        if (!result) {
            await startNode()
        }
    } catch (err) {
        log(err.message)
        sendMessageToChannel('🤬 🤬' + err.message)
        logErr(err)
    }
}, null, true)


async function checkNodeStatus() {
    return new Promise(async (resolve, reject) => {
        try {
            exec('ironfish status', async (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    log('Node is not running')
                    // reject(new Error('Node is not running | ' + err.message))

                    await sendMessageToChannel('Node is not running | ' + err.message)
                    resolve(false)

                    return
                }

                if (stderr) {
                    console.log(`stderr: ${stderr}`)
                    log('Node is not running')
                    // reject(new Error('Node is not running | ' + stderr))

                    await sendMessageToChannel('Node is not running | ' + stderr)
                    resolve(false)

                    return
                }

                log(`stdout: ${stdout}`)


                if (stdout.includes('Node                 STARTED')) {
                    log('Node is running')

                    if (firstTimeCheck) {
                        firstTimeCheck = false
                        await sendMessageToChannel('Node is running')
                    }

                    resolve(true)
                } else {
                    log('Node is not running')
                    reject(new Error('Node is not running ' + stdout))
                }
            })
        } catch (err) {
            reject(err)
        }
    })
}


main()

async function main() {
    try {
        let result = await checkNodeStatus()

        if (!result) {
            await startNode()
        }

        // await startNode()
    } catch (err) {
        log(err.message)
        sendMessageToChannel('🤬 🤬' + err.message)
        logErr(err)
    }
}


async function startNode(domainName) {
    return new Promise(async (resolve, reject) => {
        try {
            const child = spawn('ironfish', ['start'])

            let scriptOutput = ''
    
            child.stdout.setEncoding('utf8')
            child.stdout.on('data', async function (data) {
                log('stdout: ' + data.toString())
    
                data = data.toString()
                if (data.includes('Connected to the Iron Fish network')) {
                    try {
                        child.stdin.pause()
                        child.kill()
                        resolve(true)
                    } catch (err) {
                        reject(err)
                    }
                } else if (data.includes('Failed authorization procedure')) {
                    try {
                        reject(new Error(data))
                        child.stdin.pause()
                        child.kill()
                    } catch (err) {
                        reject(err)
                    }
                }
    
                scriptOutput += data
            })
    
            child.stderr.setEncoding('utf8')
            child.stderr.on('data', async function (data) {
                log('stderr: ' + data.toString())
    
                data = data.toString()
                if (data.includes('Connected to the Iron Fish network')) {
                    try {
                        child.stdin.pause()
                        child.kill()
                        resolve(true)
                    } catch (err) {
                        reject(err)
                    }
                } else if (data.includes('Failed authorization procedure')) {
                    try {
                        reject(new Error(data))
                        child.stdin.pause()
                        child.kill()
                    } catch (err) {
                        reject(err)
                    }
                }
    
                scriptOutput += data
            })
    
            child.on('close', async function (code) {
                scriptOutput += `child process exited with code ${code}`
                log(`child process exited with code ${code}`)
                reject(new Error(scriptOutput))
                child.stdin.pause()
                child.kill()
    
                // resolve(startNode())

                // await execCommand('pkill certbot')
                // if (scriptOutput.includes('error occurred:')) {
                //     reject(new Error(scriptOutput))
                // } else {
                //     resolve(true)
                // }
            })
        } catch (err) {
            log(err.message)
            sendMessageToChannel('🤬 🤬' + err.message)
            logErr(err)
        }
    })
}

async function sendMessageToChannel(message, chatId = '1001746527066') {
    try {
        fs.appendFileSync('./zic-logs.txt', `${moment().utcOffset('+0700').format('DD/MM/YYYY HH:mm:ss')} | ${message}` + '\n')

        let text = `${moment().utcOffset('+0700').format('DD/MM/YYYY HH:mm:ss')} | ${process.env.SERVER_ID} - ${process.env.SERVER_IP} | ${message}`
        let response = await axios.get(`https://api.telegram.org/bot853693738:AAFD6AA9-qGog1lA1YCOE_QeVnW99pXITHk/sendMessage?chat_id=-${chatId}&text=${encodeURIComponent(text)}`)

        log(response.data)

        return Promise.resolve(true)
    } catch (err) {
        return Promise.reject(err)
    }
}