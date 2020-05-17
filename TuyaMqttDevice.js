const TuyAPI = require('tuyapi')
const _ = require('lodash')
const debug = require('debug')('TuyaMqttDevice')

const TuyaMqttDevice = function (deviceDescriptor) {
    debug(`new TuyaMqttDevice(${deviceDescriptor})`)

    const device = new TuyAPI(_.pick(deviceDescriptor, ['ip', 'id', 'key', 'version']))

    device.on('connected', () => debug('Connected to device!'));
    device.on('disconnected', () => debug('Disconnected from device.'));
    device.on('error', error => debug('Error!', error));
    device.on('data', data => debug('Data from device:', data));

    return {
        connect: function () {
            debug('connect() called')
            device.find().then(() => {
                debug('Device found')
                // Connect to device
                device.connect().then(() => {
                    debug('Device connected')
                })
            })
        },

        on: function (event, listener) {
            debug(`Installing on('${event}') listener.`);
            device.on(event, listener);
        },

        send: function(data) {
            device.set(data)
        },

        disconnect: function () {
            device.disconnect();
        }
    }
};


module.exports = TuyaMqttDevice;
