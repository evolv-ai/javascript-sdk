import { useEffect, useState } from 'react';

import { MiniPromise } from '@evolv/client';

const ROOT = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this;

let clientPromise;

if (ROOT.evolv?.client) {
  clientPromise = MiniPromise.resolve(ROOT.evolv.client);
} else {
  clientPromise = MiniPromise.createPromise((resolve, reject) => {
    const interval = setInterval(() => {
      if (!ROOT.evolv?.client) {
        return;
      }

      clearInterval(interval);
      resolve(ROOT.evolv.client);
    }, 1);
  });
}

function delayListener(func, key, initialState) {
  const [value, setValue] = useState(initialState);

  useEffect(() => {
    let canceled = false;
    clientPromise.then((client) => {
      const canceller = client[func](key).listen((v) => {
        if (canceled) {
          canceller();
          return;
        }

        const newValue = v === undefined ? initialState : v;
        setValue(newValue);
      });
    }).catch((err) => {
      console.log(`Evolv: ${err}`)
    });
    return () => {
      canceled = true;
    };
  }, []);

  return value;
}

export const useVariable = delayListener.bind(null, 'get');
export const useConfigVariable = delayListener.bind(null, 'getConfig');
export const useIsActive = delayListener.bind(null, 'isActive');
