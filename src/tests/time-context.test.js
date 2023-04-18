import chai from 'chai';
import spies from 'chai-spies';
import { addDateTimeToContext } from '../time-context.js';
import Store from '../store.js';
import Context from '../context.js';
import { createSandbox, useFakeTimers } from 'sinon';

chai.use(spies);
const expect = chai.expect;

describe('updateTimeContext', () => {
    // mock EvolvContext with jest
    let context = null;
    const _Date = Date;
    let sandbox = null;
    let clock = null;
    const testDate = new Date('2017-06-14T11:12:13.145Z');

    beforeEach(() => {
        sandbox = createSandbox();
        clock = useFakeTimers(testDate.getTime());

        const store = new Store({});
        context = new Context(store);
        context.initialize('test', {}, {});
    });

    afterEach(() => {
        sandbox.restore();
        clock.restore();
    });


    it('should set the correct utc time info on the local context', () => {
        addDateTimeToContext(context);
        expect(context.get('utc.time.minute')).to.equal(12);
        expect(context.get('utc.time.hour')).to.equal(11);
        expect(context.get('utc.date.day')).to.equal(14);
        expect(context.get('utc.date.month')).to.equal(6);
        expect(context.get('utc.date.year')).to.equal(2017);
    });

    it('should set the correct local time info on the local context', () => {
        addDateTimeToContext(context);
        expect(context.get('time.minute')).to.equal(12);
        expect(context.get('time.hour')).to.equal(4);
        expect(context.get('date.day')).to.equal(14);
        expect(context.get('date.month')).to.equal(6);
        expect(context.get('date.year')).to.equal(2017);
    });

    it('should set the correct day of week and hour of day on the local context', () => {
        addDateTimeToContext(context);
        expect(context.get('dayOfWeek')).to.equal(3);
        expect(context.get('hourOfDay')).to.equal(4);
    });
});
