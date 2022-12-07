import assert from 'assert';
import * as predicates from '../predicates.js';

describe('predicates.js', () => {
  describe('evaluate', () => {
    it('should evaluate a flat predicate correctly', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.referrer',
            operator: 'exists',
            value: undefined,
            index: 0
          }, {
            field: 'platform',
            operator: 'equal',
            value: 'ios',
            index: 1
          }]
      };
      const context = {
        web: {
          referrer: 'http://stackoverflow.com/'
        },
        platform: 'ios'
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.filtered);
      assert.equal(2, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate a real mobile device predicate correctly', () => {
      const predicate = {
        rules: [
          {
            operator: 'equal',
            field: 'device',
            id: 'r-ce38958d-1f13-4761-8e07-f87979db3903',
            value: 'mobile',
            index: 1
          }
        ],
        combinator: 'and',
        id: 382
      };

      const context = {
        web: {
          url: 'http://vince-repo.digitalcertainty.net/fb/'
        },
        ip_address: '64.71.166.242',
        device: 'mobile'
      };

      let result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(result.passed.size, 1);
      assert.equal(result.failed.size, 0);

      context.device = 'desktop';
      result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(result.passed.size, 0);
      assert.equal(result.failed.size, 1);
    });

    it('should evaluate a nested predicate correctly', () => {
      const predicate = {
        id: 1,
        combinator: 'and',
        rules: [
          {
            combinator: 'or',
            rules: [
              {
                field: 'device',
                operator: 'equal',
                value: 'phone',
                index: 1
              },
              {
                field: 'device',
                operator: 'equal',
                value: 'desktop',
                index: 2
              },
            ]
          },
          {
            field: 'platform',
            operator: 'not_equal',
            value: 'android',
            index: 0
          }
        ]
      };
      const user = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          url: 'https://w.net?utm_campaign=com',
          referrer: 'http://stackoverflow.com/',
        },
        device: 'phone'
      };
      const result = predicates.evaluate(user, predicate);
      assert(!result.rejected);
      assert.equal(2, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should select a user into an experiment with a query string filter correctly', () => {

      const predicate = {
        rules: [
          {
            operator: "equal",
            field: "web.query_parameters.testing",
            id: "r-6b2f1647-4ced-4365-b378-0e109b040897",
            value: "test1",
            index: 0
          }
        ],
        combinator: "and",
        id: "g-4f151a9c-2710-4b61-9b77-040c00b7cdf2"
      };
      const context = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          request_url: 'https://w.net?utm_campaign=com',
          referrer: 'http://stackoverflow.com/',
          query_parameters: {
            testing: "test1"
          },
        },
        device: 'phone'
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should exclude a user that doesn\'t meet the query string filter', () => {
      const predicate = {
        rules: [
          {
            operator: "equal",
            field: "web.query_parameters.testing",
            id: "r-6b2f1647-4ced-4365-b378-0e109b040897",
            value: "test1",
            index: 0
          }
        ],
        combinator: "and",
        id: "g-4f151a9c-2710-4b61-9b77-040c00b7cdf2"
      };
      const context = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          url: 'https://w.net?utm_campaign=com',
          referrer: 'http://stackoverflow.com/',
          query_parameters: {
            testing: "test2"
          },
        },
        device: 'phone'
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(0, result.passed.size);
      assert.equal(1, result.failed.size);
    });

    it('should exclude a user that has a query string that doesn\'t meet the query string filter', () => {
      const predicate = {
        rules: [
          {
            operator: "equal",
            field: "web.query_parameters.testing",
            id: "r-6b2f1647-4ced-4365-b378-0e109b040897",
            value: "test1",
            index: 0
          }
        ],
        combinator: "and",
        id: "g-4f151a9c-2710-4b61-9b77-040c00b7cdf2"
      };
      const context = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          url: 'https://w.net?utm_campaign=com',
          referrer: 'http://stackoverflow.com/',
          query_parameters: {
            cartwheel: "test2"
          },
        },
        device: 'phone'
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(0, result.passed.size);
      assert.equal(1, result.failed.size);
    });

    it('should exclude a user that doesn\'t have a query string and query string filter', () => {
      const predicate = {
        rules: [
          {
            operator: "equal",
            field: "web.query_parameters.testing",
            id: "r-6b2f1647-4ced-4365-b378-0e109b040897",
            value: "test1",
            index: 0
          }
        ],
        combinator: "and",
        id: "g-4f151a9c-2710-4b61-9b77-040c00b7cdf2"
      };
      const context = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          url: 'https://w.net?utm_campaign=com',
          query_parameters: {
            utm_campaign: 'com'
          },
          referrer: 'http://stackoverflow.com/'
        },
        device: 'phone'
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(0, result.passed.size);
      assert.equal(1, result.failed.size);
    });

    it('should fail if all clauses of an "or" fail', () => {
      const predicate = {
        id: 1,
        combinator: 'or',
        rules: [
          {
            field: 'device',
            operator: 'equal',
            value: 'phone',
            index: 0
          },
          {
            field: 'device',
            operator: 'equal',
            value: 'desktop',
            index: 1
          }
        ]
      };
      const context = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          url: 'https://w.net?utm_campaign=com',
          referrer: 'http://stackoverflow.com/',
        },
        device: 'tablet'
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(0, result.passed.size);
      assert.equal(2, result.failed.size);
    });


    it('should fail if any clauses of an "and" fail', () => {
      const predicate = {
        id: 1,
        combinator: 'and',
        rules: [
          {
            field: 'device',
            operator: 'equal',
            value: 'tablet',
            index: 0
          },
          {
            field: 'device',
            operator: 'equal',
            value: 'desktop',
            index: 1
          }
        ]
      };
      const context = {
        web: {
          user_agent: 'Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 ' +
            '(KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10',
          url: 'https://w.net?utm_campaign=com',
          referrer: 'http://stackoverflow.com/'
        },
        device: 'tablet'
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(1, result.failed.size);
    });

    it('should evaluate a regex predicate correctly', () => {
      const predicate = {
        combinator: 'and',
        id: 583,
        rules: [
          {
            field: 'ip_address',
            id: 'r-ba15bef1-1606-42c5-a60b-96583c06c12f',
            index: 0,
            operator: 'regex64_match',
            value: Buffer.from('/^192\\.169\\.0\\..*$/').toString('base64')
          }
        ]
      };
      const context = {
        ip_address: '192.169.0.1'
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);

      const context2 = {
        ip_address: '192.168.0.1'
      };
      const result2 = predicates.evaluate(context2, predicate);
      assert(result2.rejected);
      assert.equal(1, result2.failed.size);
    });

    it('should evaluate a real predicate correctly', () => {
      const predicate = {
        combinator: 'and',
        id: 583,
        rules: [
          {
            field: 'ip_address',
            id: 'r-ba15bef1-1606-42c5-a60b-96583c06c12f',
            index: 0,
            operator: 'equal',
            value: '64.71.166.242'
          }, {
            combinator: 'and',
            id: 583,
            rules: [
              {
                field: 'device',
                id: 'r-92325c89-e07e-4dd4-8e88-15528c19d43c',
                index: 1,
                operator: 'equal',
                value: 'mobile'
              },
              {
                combinator: 'and',
                id: 583,
                rules: [
                  {
                    field: 'web.referrer',
                    id: 'r-db644b3f-d56e-478f-984f-4c5a1099cd35',
                    index: 2,
                    operator: 'equal',
                    value: 'http://vince-repo.digitalcertainty.net/test/'
                  }
                ]
              }
            ]
          }
        ]
      };
      const context = {
        web: {
          url: 'http://vince-repo.digitalcertainty.net/fb/'
        },
        ip_address: '64.71.166.242',
        device: 'mobile'
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      // IP matches, so rule 0 should pass; Client rule 2 sent as true, so rule
      // 2 should pass.
      assert.equal(2, result.passed.size);
      // "Device is not mobile; Referrer URL is not /test"
      assert.equal(1, result.failed.size);
    });

    it('should not filter energidirect user with not_contains', () => {
      const predicate = {
        "id": "g-3909d043-f42b-45ba-8f28-17b1da5307e0",
        "rules": [{
          "operator": "not_contains",
          "id": "r-f2dc0b86-665f-41d7-a142-7dd0658fa9bd",
          "field": "web.query_parameters.ecmp",
          "value": ["aff:dav"],
          "index": 1
        }],
        "combinator": "or"
      };
      const context = {
        "web": {
          "query_parameters": {
            "ecmp": "sea:nbs:acq:google::nonbrand-stroom::con",
            "gclsrc": "aw.ds",
            "campaignid": "sea:43700014200286505",
            "gclid": "*"
          }
        },
        "action": "get_candidate",
        "cid": "",
        "did": "1540762943_1558310400",
        "uid": "3592933167_1558310400",
        "ver": "3",
        "page": "/beste-bod?ecmp=sea:nbs:acq:google::nonbrand-stroom::con&gclsrc=aw.ds&campaignid=sea:43700014200286505&gclid=*",
        "rtver": "3.1.568",
        "acode": "263109707-2",
        "filters": "JwnEl_00_1",
        "user_attributes": {},
        "country": "US",
        "platform": "other",
        "browser": "safari",
        "device": "desktop",
        "agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36",
        "experiments": {},
        "ipFilter": false,
        "bot": true,
        "ip_address": "66.249.69.101",
        "message_version": 1
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should filter energidirect user with not_contains', () => {

      const predicate = {
        "id": "g-3909d043-f42b-45ba-8f28-17b1da5307e0",
        "rules": [{
          "operator": "not_contains",
          "id": "r-f2dc0b86-665f-41d7-a142-7dd0658fa9bd",
          "field": "web.query_parameters.ecmp",
          "value": "aff:dav",
          "index": 1
        }],
        "combinator": "or"
      };
      const context = {
        web: {
          "query_parameters": {
            "ecmp": "sea:nbs:acq:google:aff:dav:nonbrand-stroom::con",
            "gclsrc": "aw.ds",
            "campaignid": "sea:43700014200286505",
            "gclid": "*"
          },
        },
        "action": "get_candidate",
        "cid": "",
        "did": "1540762943_1558310400",
        "uid": "3592933167_1558310400",
        "ver": "3",
        "page": "/beste-bod?ecmp=sea:nbs:acq:google::nonbrand-stroom::con&gclsrc=aw.ds&campaignid=sea:43700014200286505&gclid=*",
        "rtver": "3.1.568",
        "acode": "263109707-2",
        "country": "US",
        "platform": "other",
        "browser": "safari",
        "device": "desktop",
        "agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36",
        "experiments": {},
        "ipFilter": false,
        "bot": true,
        "ip_address": "66.249.69.101",
        "message_version": 1
      };
      const result = predicates.evaluate(context, predicate);
      assert(result.rejected);
      assert.equal(0, result.passed.size);
      assert.equal(1, result.failed.size);
    });

    it('should evaluate a flat predicate correctly', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.referrer',
            operator: 'exists',
            value: undefined,
            index: 0
          }, {
            field: 'platform',
            operator: 'equal',
            value: 'ios',
            index: 1
          }]
      };
      const context = {
        web:{
          referrer: 'localhost'
        },
        platform: 'ios',
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(2, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate greater than and less than properties', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.pageWidth',
            operator: 'greater_than',
            value: 1200,
            index: 0
          },
          {
            field: 'web.pageWidth',
            operator: 'less_than',
            value: 1400,
            index: 0
          }
        ]
      };
      const context = {
        web:{
          pageWidth: 1300
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(2, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate "greater than or equal to" and "less than or equal to" properties', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.pageWidth',
            operator: 'greater_than_or_equal_to',
            value: 1200,
            index: 0
          },
          {
            field: 'web.pageWidth',
            operator: 'less_than_or_equal_to',
            value: 1500,
            index: 0
          }
        ]
      };
      const context = {
        web:{
          pageWidth: 1200
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(2, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate "does not exist" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'platform',
            operator: 'not_exists',
            index: 0
          }
        ]
      };
      const context = {
        web:{
          pageWidth: 1200
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate "is True" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.isDesktop',
            operator: 'is_true',
            index: 0
          }
        ]
      };
      const context = {
        web:{
          isDesktop: true
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate "is False" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.isDesktop',
            operator: 'is_false',
            index: 0
          }
        ]
      };
      const context = {
        web:{
          isDesktop: false
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate "Typeless equal" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.pageWidth',
            operator: 'loose_equal',
            value: 1200,
            index: 0
          }
        ]
      };
      const context = {
        web:{
          pageWidth: 1200
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

    it('should evaluate "Typeless not_equal" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.pageWidth',
            operator: 'loose_not_equal',
            value: 1250,
            index: 0
          }
        ]
      };
      const context = {
        web:{
          pageWidth: 1200
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });
    it('should evaluate "in" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.platform',
            operator: 'in',
            value: ["MacOs", "Linux"],
            index: 0
          }
        ]
      };
      const context = {
        web:{
          platform: "Linux"
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });
    it('should evaluate "not in" property', () => {
      const predicate = {
        id: 123,
        combinator: 'and',
        rules: [
          {
            field: 'web.platform',
            operator: 'not_in',
            value: ["MacOs", "Linux"],
            index: 0
          }
        ]
      };
      const context = {
        web:{
          platform: "Android"
        },
      };
      const result = predicates.evaluate(context, predicate);
      assert(!result.rejected);
      assert.equal(1, result.passed.size);
      assert.equal(0, result.failed.size);
    });

  });
});
