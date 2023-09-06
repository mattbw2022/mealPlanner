import { ExpressValidator } from 'express-validator';

const { body } = new ExpressValidator({
    isEmailNotInUse: async value => {
      const user = await Users.findByEmail(value);
      if (user) {
        throw new Error('E-mail already in use');
      }
    },
  });