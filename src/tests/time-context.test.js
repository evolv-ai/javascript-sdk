import chai from 'chai';
import spies from 'chai-spies';
import { addDateTimeToContext } from '../time-context.js';
import Store from '../store.js';
import Context from '../context.js';
import { createSandbox, useFakeTimers } from 'sinon';

chai.use(spies);
const expect = chai.expect;

describe('updateTimeContext', () => {
    let context = null;
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


    describe('initial time set', () => {
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
            // Cannot override the timezone, so we can't test the local time
            // expect(context.get('time.hour')).to.equal(4);
            expect(context.get('date.day')).to.equal(14);
            expect(context.get('date.month')).to.equal(6);
            expect(context.get('date.year')).to.equal(2017);
        });

        it('should set the correct day of week and hour of day on the local context', () => {
            addDateTimeToContext(context);
            expect(context.get('dayOfWeek')).to.equal(3);
            // Cannot override the timezone, so we can't test the local time
            // expect(context.get('hourOfDay')).to.equal(4);
        });
    });

    describe('a new year', () => {
        it('should set the correct utc time info on the local context after we move to a new year', () => {
            const testDate = new Date('2017-12-31T23:59:13.145Z');
            clock.restore();

            clock = useFakeTimers(testDate.getTime());

            addDateTimeToContext(context);
            expect(context.get('utc.time.minute')).to.equal(59);
            expect(context.get('utc.time.hour')).to.equal(23);
            expect(context.get('utc.date.day')).to.equal(31);
            expect(context.get('utc.date.month')).to.equal(12);
            expect(context.get('utc.date.year')).to.equal(2017);

            // Cannot override the timezone, so we can't test the local time
            /*expect(context.get('time.minute')).to.equal(59);
            expect(context.get('time.hour')).to.equal(15);
            expect(context.get('date.day')).to.equal(31);
            expect(context.get('date.month')).to.equal(12);
            expect(context.get('date.year')).to.equal(2017);*/

            clock.tick(120000);

            expect(context.get('utc.time.minute')).to.equal(1);
            expect(context.get('utc.time.hour')).to.equal(0);
            expect(context.get('utc.date.day')).to.equal(1);
            expect(context.get('utc.date.month')).to.equal(1);
            expect(context.get('utc.date.year')).to.equal(2018);

            // Cannot override the timezone, so we can't test the local time
            /*expect(context.get('time.minute')).to.equal(1);
            expect(context.get('time.hour')).to.equal(16);
            expect(context.get('date.day')).to.equal(31);
            expect(context.get('date.month')).to.equal(12);
            expect(context.get('date.year')).to.equal(2017);*/
        });
    });

    describe('polling time updates', () => {
        it('should not update the time context if continueTimeUpdate is false', () => {
            addDateTimeToContext(context, false);
            expect(context.get('time.minute')).to.equal(12);
            clock.tick(60000);
            expect(context.get('time.minute')).to.equal(12);
        });

        it('should update the time context every minute if no value passed in - default is true', () => {
            addDateTimeToContext(context);
            expect(context.get('time.minute')).to.equal(12);
            clock.tick(60000);
            expect(context.get('time.minute')).to.equal(13);
        });

        it('should update the time context every minute', () => {
            addDateTimeToContext(context, true);
            expect(context.get('time.minute')).to.equal(12);
            clock.tick(60000);
            expect(context.get('time.minute')).to.equal(13);
        });
    });
});
