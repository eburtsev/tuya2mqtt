const MQTT = require('mqtt')
const Yaml = require('yamljs')
const debug = require('debug')('tuya2mqtt')

const TuyaMqttDevice = require('./TuyaMqttDevice')

function readConfig() {
    try {
        let config = Yaml.parseFile('config.yaml').tuya2mqtt

        if (!config.mqtt || !config.mqtt.host) {
            throw "mqtt.host is not defined";
        }

        config.mqtt['base-topic'] = config.mqtt['base-topic'] || 'tuya2mqtt';

        for (let device of config.devices) {
            device['mqtt-topic'] = device['mqtt-topic'] || device.id
        }
        return config
    } catch (e) {
        console.error(`[ERROR] config.yaml not found or it has wrong format. Cause: [${e}]. Exiting...`)
        process.exit(-1)
    }
}

// -- Main section --
debug('Starting')

let config = readConfig()
debug('Config: ', config)

const devices = {}

function connectDevices() {
    for (let deviceDescriptor of config.devices) {
        let device = devices[deviceDescriptor['mqtt-topic']] = new TuyaMqttDevice(deviceDescriptor)
        device.on('data', data => mqttClient.publish(`${config.mqtt['base-topic']}/${deviceDescriptor['mqtt-topic']}/state`, JSON.stringify(data)))
        device.connect()
    }
}

const mqttClient = MQTT.connect({
    host: config.mqtt.host,
    port: config.mqtt.port,
    username: config.mqtt.username,
    password: config.mqtt.password
})

mqttClient.on('connect', function (err) {
    debug('MQTT broker connection established', err)
    const topic = `${config.mqtt['base-topic']}/+/set`
    debug(`Subscribing ${topic}`)
    mqttClient.subscribe(topic,(err) => {
        if (!err) {
            debug(`Subscribed to ${topic}`)
            connectDevices()
        } else {
            debug(`Subscribe failed: ${err}`)
        }
    })
})

mqttClient.on('message', function (topic, message) {
    debug(`Message received. Topic ${topic}. Message: ${message}`)
    const [ignored, deviceKey, cmd] = topic.split('/')
    debug(`Device ${deviceKey}. Command: ${cmd}`)
    if (cmd === 'set') {
        let device = devices[deviceKey];
        if (device) {
            devices[deviceKey].send(JSON.parse(`${message}`))
        } else {
            debug(`Unknown device "${deviceKey}"`)
        }
    } else if (cmd === 'state') {
        // Do nothing
    } else {
        debug(`Unknown command: ${cmd}`)
    }
})

mqttClient.on('error', function (error) {
    debug('Error occurred:', error)
})
