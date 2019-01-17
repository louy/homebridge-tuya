const TuyaDevice = require('tuyapi');

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

class ContactSensor {
  constructor(platform, homebridgeAccessory, deviceConfig) {
    this.platform = platform;
    PlatformAccessory = platform.api.platformAccessory;

    ({Accessory, Service, Characteristic, uuid: UUIDGen} = platform.api.hap);

    this.log = platform.log;
    this.homebridgeAccessory = homebridgeAccessory;
    this.deviceConfig = deviceConfig;

    this.device = new TuyaDevice(deviceConfig);

    if (this.homebridgeAccessory) {
      this.log.debug('Existing Accessory found [%s] [%s] [%s]', homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID);
      this.homebridgeAccessory.displayName = this.deviceConfig.name;
    } else {
      this.log.debug('Creating new Accessory %s', this.deviceConfig.id);
      this.homebridgeAccessory = new PlatformAccessory(this.deviceConfig.name, UUIDGen.generate(this.deviceConfig.id + this.deviceConfig.name), Accessory.Categories.SENSOR);
      platform.registerPlatformAccessory(this.homebridgeAccessory);
    }

    this.contactSensorService = this.homebridgeAccessory.getService(Service.ContactSensor);
    if (this.contactSensorService) {
      this.contactSensorService.setCharacteristic(Characteristic.Name, this.deviceConfig.name);
    } else {
      this.log.debug('Creating new Service %s', this.deviceConfig.id);
      this.contactSensorService = this.homebridgeAccessory.addService(Service.ContactSensor, this.deviceConfig.name);
    }

    this.contactSensorService.getCharacteristic(Characteristic.ContactSensorState)
      .on('get', callback => {
        this.log.debug('[%s] On get', this.homebridgeAccessory.displayName);

        this.device.get().then(status => {
        this.log.debug('[%s] Get result: %sj', this.homebridgeAccessory.displayName, JSON.stringify(status));
        // TODO: Characteristic.ContactSensorState.CONTACT_DETECTED OR Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
        callback(null, status);
        }).catch(error => {
          callback(error);
        });
      });
    
    // TODO: persist connection for alerts to work

    this.homebridgeAccessory.on('identify', (paired, callback) => {
      this.log.debug('[%s] identify', this.homebridgeAccessory.displayName);
      callback();
    });
  }
}

module.exports = ContactSensor;
