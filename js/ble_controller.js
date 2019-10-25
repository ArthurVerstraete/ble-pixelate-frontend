class BleController extends EventTarget {

  static CONTROLLER_SERVICE = 'af86fd1e-91f8-4c55-9001-bcce653f7737';
  static TOUCH_CHARACTERISTIC = '00a20202-b071-4cb9-a614-ce54d049d534';

  constructor() {
    super();
    this.utf8decoder = new TextDecoder(); // default 'utf-8' or 'utf8'
  }

  connect() {
    log("Connecting to controller ...");
    return new Promise((resolve, reject) => { navigator.bluetooth.requestDevice({
        filters: [
          {services: [
              // All accessible services need to be added
              BleController.CONTROLLER_SERVICE
            ]
          }
        ]
      })
      .then(dev => {
        this.device = dev;
        log('Connecting to GATT Server ...');
        return this.device.gatt.connect();
      })
      .then(server => {
        log('Connected to GATT server');
        this.subscribe_to_touch_characteristic();
        resolve(null)
      }).catch((error) => {
        log(error)
        reject("Failed to connect to BLE controller")
      })
    });
  }

  ///////////////// internal methods //////////////////////
  subscribe_to_touch_characteristic() {
    if (this.device) {
      log('Getting Controller Service ...');
      this.device.gatt.getPrimaryService(BleController.CONTROLLER_SERVICE)
      .then(service => {
        log('Getting Touch Characteristic ...');
        return service.getCharacteristic(BleController.TOUCH_CHARACTERISTIC);
      })
      .then(characteristic => {
        return characteristic.startNotifications().then(_ => {
          log('Subscribed to Touch notifications');
          characteristic.addEventListener('characteristicvaluechanged', (e) => this.handleTouchEvent(e));
        });
      })
      .catch(error => {
        log('ERROR ' + error);
      });
    }
  }

  handleTouchEvent(event) {
    console.log("Handling touch");
    let touchEvent = new Event('touch');
    touchEvent.touchedKey = this.utf8decoder.decode(event.target.value);
    this.dispatchEvent(touchEvent);
  }
}