const TuyAPI = require('tuyapi')
const _ = require('lodash')
const debug = require('debug')('TuyaMqttDevice')

const TuyaMqttDevice = function (deviceDescriptor) {
    debug(`new TuyaMqttDevice(${deviceDescriptor})`)

    const device = new TuyAPI(_.pick(deviceDescriptor, ['ip', 'id', 'key', 'version']))
    let listeners = {}
    let connected = false

    device.on('connected', () => {
        debug('Connected to device!');
        (listeners['connected'] || (() => {}))();
    });

    device.on('disconnected', () => {
        connected = false;
        debug('Disconnected from device.');
        (listeners['disconnected'] || (() => {}))();
    });

    device.on('error', error => {
        debug('Error!', error);
        (listeners['error'] || (() => {}))(error);
    });

    device.on('data', data => {
        debug('Data from device:', data);
        (listeners['data'] || (() => {}))(data);
    });

    device.on('heartbeat', () => {
        debug('Heartbeat received');
        (listeners['heartbeat'] || (() => {}))();
    });

    return {
        connect: function (sendAfterConnect) {
            debug('connect() called')
            device.find().then(() => {
                debug('Device found')
                // Connect to device
                device.connect().then(() => {
                    debug('Device connected')
                    connected = true
                    if (sendAfterConnect !== undefined) {
                        this.send(sendAfterConnect)
                    }
                })
            })
        },

        on: function (event, listener) {
            debug(`Installing on('${event}') listener.`)
            listeners[event] = listener
        },

        send: function(data) {
            if (!connected) {
                this.connect(data)
            } else {
                device.set(data)
            }
        },

        disconnect: function () {
            device.disconnect()
            connected = false
        }
    }
};

module.exports = TuyaMqttDevice
