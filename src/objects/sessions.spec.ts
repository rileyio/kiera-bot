import test from 'ava';
import { DeviceSession } from './sessions';
import { ObjectID } from 'bson';

const device = new DeviceSession({
  _id: new ObjectID('5c26e1e8bfec094ba490229c'),
  isActive: true,
  isDeactivated: false,
  activateTimestamp: 0,
  deactivateTimestamp: 0,
  name: '',
  react: { time: 5 },
  duration: { min: 0, max: 0 },
  intensity: { min: 0, max: 100, modifier: 10 },
  limit: { time: 0, intensity: 100 },
  reacts: [1, 3, 5],
  sid: new ObjectID('5c24c5b97cebe921a36e8336'),
  uid: new ObjectID('5c26c497d99a4172787131be'),
  type: 'lovense'
});
var firstRemainingTime = 0

test('DeviceSession:Calculate => react time', async t => {
  t.is(device.getTotalReactTime(), 15)
})

test('DeviceSession:Activate => Activate Session', async t => {
  t.plan(3)
  device.activate(new ObjectID('5c26c497d99a4172787131be'))

  firstRemainingTime = device.timeRemaining

  t.not(device.activateTimestamp, 0) // No real control over this outside method
  t.is(device.isActive, true)
  t.is(device.timeRemaining > 0, true)
})

test('DeviceSession:Activate => Update Session', async t => {
  device.update()
  t.is(firstRemainingTime >= device.timeRemaining, true)
})
